import { describe, expect, it } from "vitest";
import projectsData from "../../../data/projects.json";
import skillsData from "../../../data/skills.json";
import type { Project } from "../../types/projects";
import type { SkillsData } from "../../types/skills";
import {
  buildSignalLoomGraph,
  buildSkillHrefs,
  capabilityNodeIdForSkill,
  defaultNarrative,
  defaultPathEdgeIds,
  edgeStrokeWidth,
  mostConnectedNodeId,
  projectHref,
} from "./signal-loom";
import type {
  SignalEdgeEmphasis,
  SignalLoomGraph,
  SignalLoomProjectDetail,
} from "./signal-loom";

const skills: SkillsData = {
  categories: [
    {
      name: "Machine Learning & AI",
      icon: "brain",
      skills: [{ name: "Machine Learning", proficiency: 5 }],
    },
    {
      name: "Web Development",
      icon: "code",
      skills: [{ name: "React.js", proficiency: 3 }],
    },
  ],
};

const projects: Project[] = [
  {
    title: "Forecasting System",
    featured: true,
    category: "ml",
    period: "2026",
    description: "Forecasts demand. It provides a dashboard.",
    links: [],
    skills: ["Machine Learning"],
  },
  {
    title: "Interface System",
    featured: true,
    category: "web",
    period: "2026",
    description: "Builds an interface.",
    links: [],
    skills: ["React.js"],
  },
  {
    title: "Unfeatured Project",
    category: "cli",
    period: "2025",
    description: "Included in the map even without a featured flag.",
    links: [],
    skills: ["Machine Learning"],
  },
];

describe("buildSignalLoomGraph", () => {
  it("builds deterministic capability-to-every-project edges with overlap weights", () => {
    const graph = buildSignalLoomGraph(projects, skills);

    // Every supplied project is a node (Sprint 3 objective) — no `featured`
    // filter — with the capability hubs first and source order preserved.
    expect(graph.nodes.map((node) => node.id)).toEqual([
      "capability-machine-learning-ai",
      "capability-web-development",
      "project-forecasting-system",
      "project-interface-system",
      "project-unfeatured-project",
    ]);
    // Edge order is project order then category order, and `weight` is the
    // declared skill overlap count (M3.1.2), not a taste knob.
    expect(graph.edges).toEqual([
      {
        id: "capability-machine-learning-ai->project-forecasting-system",
        from: "capability-machine-learning-ai",
        to: "project-forecasting-system",
        label: "Machine Learning",
        weight: 1,
      },
      {
        id: "capability-web-development->project-interface-system",
        from: "capability-web-development",
        to: "project-interface-system",
        label: "React.js",
        weight: 1,
      },
      {
        id: "capability-machine-learning-ai->project-unfeatured-project",
        from: "capability-machine-learning-ai",
        to: "project-unfeatured-project",
        label: "Machine Learning",
        weight: 1,
      },
    ]);
    // L2.3 narrative first frame: default to the most-connected hub (tie-break
    // by node order), so the section opens on a visible connection.
    expect(graph.defaultNodeId).toBe("capability-machine-learning-ai");
  });

  it("resolves parenthetical project skills against plain category skills", () => {
    const categories: SkillsData = {
      categories: [
        {
          name: "Programming Languages",
          icon: "terminal",
          skills: [{ name: "Python", proficiency: 5 }],
        },
      ],
    };
    const pythonProject: Project = {
      title: "Python Platform",
      featured: true,
      category: "ml",
      period: "2026",
      description: "Ships a Python pipeline.",
      links: [],
      skills: ["Python (Programming Language)"],
    };

    const graph = buildSignalLoomGraph([pythonProject], categories);

    expect(graph.edges).toEqual([
      {
        id: "capability-programming-languages->project-python-platform",
        from: "capability-programming-languages",
        to: "project-python-platform",
        label: "Python (Programming Language)",
        weight: 1,
      },
    ]);
  });

  it("links a broader project skill through containment, not shared tokens", () => {
    const categories: SkillsData = {
      categories: [
        {
          name: "Web Development",
          icon: "code",
          skills: [{ name: "Back-End Web Development", proficiency: 4 }],
        },
      ],
    };
    const webProject: Project = {
      title: "Portfolio Site",
      featured: true,
      category: "web",
      period: "2026",
      description: "A static portfolio.",
      links: [],
      skills: ["Web Development"],
    };

    const graph = buildSignalLoomGraph([webProject], categories);

    // "web development" is contained in "back-end web development", so the arm
    // of the match that survived Task 3.1 links them.
    expect(graph.edges.map((edge) => edge.from)).toContain("capability-web-development");
    expect(graph.edges[0]?.label).toBe("Web Development");
    expect(graph.edges[0]?.weight).toBe(1);
  });

  it("does not fabricate edges from shared tokens (Task 3.1)", () => {
    const categories: SkillsData = {
      categories: [
        {
          name: "IoT & Embedded Systems",
          icon: "cpu",
          skills: [{ name: "Embedded Systems", proficiency: 4 }],
        },
        {
          name: "Data Science & Analytics",
          icon: "chart",
          skills: [{ name: "Data Engineering", proficiency: 4 }],
        },
      ],
    };
    const project: Project = {
      title: "Recommender Project",
      featured: true,
      category: "ml",
      period: "2026",
      description: "Recommends things.",
      links: [],
      // The removed token rule matched both of these on "systems"/"engineering"
      // and drew edges that are simply false.
      skills: ["Recommender Systems", "Prompt Engineering"],
    };

    const graph = buildSignalLoomGraph([project], categories);

    expect(graph.edges).toEqual([]);
  });

  it("handles empty inputs without inventing a default node", () => {
    const graph = buildSignalLoomGraph([], { categories: [] });
    expect(graph).toEqual({ nodes: [], edges: [], defaultNodeId: "" });
  });
});

describe("edgeStrokeWidth", () => {
  const emphasisStates: SignalEdgeEmphasis[] = ["rest", "hover", "active"];

  it("thickens an edge by its declared overlap weight", () => {
    expect(emphasisStates.map((e) => edgeStrokeWidth(1, e))).toEqual([1.1, 1.6, 2]);
    expect(emphasisStates.map((e) => edgeStrokeWidth(2, e))).toEqual([1.8, 2.3, 2.7]);
  });

  it("keeps every weight/emphasis pair visually distinct", () => {
    const widths = [1, 2].flatMap((w) => emphasisStates.map((e) => edgeStrokeWidth(w, e)));
    expect(new Set(widths).size).toBe(widths.length);
  });

  it("falls back to the base width for a non-finite or non-positive weight", () => {
    for (const bad of [0, -3, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(edgeStrokeWidth(bad, "rest")).toBe(1.1);
    }
  });
});

describe("mostConnectedNodeId", () => {
  it("picks the node with the most edges and breaks ties by node order", () => {
    const nodes = [
      { id: "hub", label: "Hub", kind: "capability" as const, summary: "" },
      { id: "a", label: "A", kind: "project" as const, summary: "" },
      { id: "b", label: "B", kind: "project" as const, summary: "" },
    ];
    const edges = [
      { id: "hub->a", from: "hub", to: "a", label: "", weight: 1 },
      { id: "hub->b", from: "hub", to: "b", label: "", weight: 1 },
      { id: "a->b", from: "a", to: "b", label: "", weight: 1 },
    ];

    expect(mostConnectedNodeId(nodes, edges)).toBe("hub");
  });

  it("returns null for an edge-free graph so callers can fall back", () => {
    const nodes = [
      { id: "x", label: "X", kind: "capability" as const, summary: "" },
      { id: "y", label: "Y", kind: "project" as const, summary: "" },
    ];

    expect(mostConnectedNodeId(nodes, [])).toBeNull();
  });
});

/**
 * M2.4 — the skill chip → Capability Map bridge. This is the single normaliser
 * (M3.1.3): the project-card chip and the Sprint 3 graph both resolve skills
 * through `capabilityNodeIdForSkill`, so a chip can never point at a capability
 * the graph does not draw.
 */
describe("Task 2.4 — skill → Capability Map bridge", () => {
  const sample: Project = {
    title: "Forecasting System",
    category: "ml",
    period: "2026",
    description: "Forecasts demand.",
    links: [],
    skills: ["Machine Learning", "IndexedDB"],
  };

  it("derives the project detail href from the title with a stable slug", () => {
    // M2.4.2: the id is derived from the content, not a list index, so the same
    // title always yields the same route and the value is reproducible.
    expect(projectHref(sample)).toBe("/work/forecasting-system");
    expect(projectHref(sample)).toBe(projectHref({ ...sample }));
  });

  it("resolves a skill to the capability node that declares it", () => {
    expect(capabilityNodeIdForSkill("Machine Learning", skills.categories)).toBe(
      "capability-machine-learning-ai",
    );
    expect(capabilityNodeIdForSkill("React.js", skills.categories)).toBe(
      "capability-web-development",
    );
  });

  it("returns null for a skill no capability declares (never invents a node id)", () => {
    expect(capabilityNodeIdForSkill("IndexedDB", skills.categories)).toBeNull();
  });

  it("maps every project skill to a node link or the honest section fallback", () => {
    const hrefs = buildSkillHrefs(projects, skills.categories);
    expect(hrefs["Machine Learning"]).toBe("#signal-capability-machine-learning-ai");
    expect(hrefs["React.js"]).toBe("#signal-capability-web-development");
    // Every skill of every supplied project is covered, so a chip always has an
    // href and the island never has to guess.
    for (const project of projects) {
      for (const skill of project.skills) expect(hrefs[skill]).toBeTruthy();
    }
  });

  it("falls back to the section anchor for a skill the map cannot place (M2.4.3)", () => {
    const hrefs = buildSkillHrefs([sample], skills.categories);
    expect(hrefs["Machine Learning"]).toBe("#signal-capability-machine-learning-ai");
    expect(hrefs.IndexedDB).toBe("#systems-in-motion");
  });

  it("keeps node ids stable when categories are reordered (M2.4.2)", () => {
    // The id is derived from the capability's name, not its position, so
    // reordering the source array cannot move a skill's anchor.
    const reversed: SkillsData = { categories: [...skills.categories].reverse() };
    expect(capabilityNodeIdForSkill("Machine Learning", reversed.categories)).toBe(
      "capability-machine-learning-ai",
    );
    expect(capabilityNodeIdForSkill("React.js", reversed.categories)).toBe(
      "capability-web-development",
    );
  });
});

/**
 * M3.1.5 — pin the real, measured numbers against the live data layer.
 *
 * These are not targets, they are readings: the graph built from the 22
 * projects and 8 skill categories as they exist right now. If the data changes
 * the graph must change with it, and this test is the alarm.
 */
describe("Task 3.1 — real portfolio data", () => {
  const skills = skillsData as SkillsData;
  const projects = projectsData.projects as Project[];
  const graph = buildSignalLoomGraph(projects, skills);

  it("maps every category and every project — 8 + 22 = 30 nodes", () => {
    expect(graph.nodes).toHaveLength(8 + 22);
    expect(graph.nodes.filter((node) => node.kind === "capability")).toHaveLength(8);
    expect(graph.nodes.filter((node) => node.kind === "project")).toHaveLength(22);
  });

  it("draws 31 honest edges", () => {
    expect(graph.edges).toHaveLength(31);
  });

  it("weights every edge by its declared overlap count", () => {
    const distribution = graph.edges.reduce<Record<number, number>>((acc, edge) => {
      acc[edge.weight] = (acc[edge.weight] ?? 0) + 1;
      return acc;
    }, {});
    expect(distribution).toEqual({ 1: 24, 2: 7 });
  });

  it("leaves no node isolated and no category without an edge", () => {
    const connected = new Set<string>();
    for (const edge of graph.edges) {
      connected.add(edge.from);
      connected.add(edge.to);
    }
    const isolated = graph.nodes.filter((node) => !connected.has(node.id));
    expect(isolated).toEqual([]);
  });

  it("opens on the Machine Learning & AI hub (9 edges)", () => {
    expect(graph.defaultNodeId).toBe("capability-machine-learning-ai");
  });

  it("is deterministic — two builds are byte-identical", () => {
    expect(buildSignalLoomGraph(projects, skills)).toEqual(graph);
  });
});

/**
 * M3.3.1 — the evidence a selected project node renders.
 *
 * The panel is only as honest as this contract: a project with no links must
 * carry an empty array (so the island can omit the group), `association` must be
 * absent when the data declares none (no empty label), and `media` must never be
 * carried at all — its values are display *labels*, not URLs, and the files do
 * not exist under `public/` (T2.2, P6).
 */
describe("Task 3.3 — project detail contract", () => {
  const detailed: Project = {
    title: "Associated Project",
    category: "ml",
    period: "2026",
    description: "Has an association, links, and media labels.",
    links: [{ label: "Live Demo", url: "https://example.com/demo" }],
    skills: ["Machine Learning", "Python"],
    association: "Universitas AMIKOM Yogyakarta",
    media: ["Prototype"],
  };
  const bare: Project = {
    title: "Bare Project",
    category: "cli",
    period: "2025",
    description: "No association, no links, no media.",
    links: [],
    skills: ["Bash"],
  };

  const detailOf = (g: ReturnType<typeof buildSignalLoomGraph>, id: string) =>
    g.nodes.find((node) => node.id === id)?.detail;

  it("carries declared skills and links on a project node", () => {
    const graph = buildSignalLoomGraph([detailed], skills);
    expect(detailOf(graph, "project-associated-project")).toEqual({
      association: "Universitas AMIKOM Yogyakarta",
      skills: ["Machine Learning", "Python"],
      links: [{ label: "Live Demo", url: "https://example.com/demo" }],
    });
  });

  it("leaves capability nodes without detail so switching to a hub can clear the panel", () => {
    const graph = buildSignalLoomGraph([detailed], skills);
    const capabilities = graph.nodes.filter((node) => node.kind === "capability");
    expect(capabilities.length).toBeGreaterThan(0);
    for (const node of capabilities) expect(node.detail).toBeUndefined();
  });

  it("omits association entirely when the project declares none", () => {
    const graph = buildSignalLoomGraph([bare], skills);
    expect(detailOf(graph, "project-bare-project")).toEqual({ skills: ["Bash"], links: [] });
    expect(detailOf(graph, "project-bare-project")).not.toHaveProperty("association");
  });

  it("keeps an empty links array rather than inventing a link", () => {
    const graph = buildSignalLoomGraph([bare], skills);
    expect(detailOf(graph, "project-bare-project")?.links).toEqual([]);
  });

  it("never carries media — its values are labels, not openable evidence", () => {
    const graph = buildSignalLoomGraph([detailed], skills);
    // `media` survives in the data (facts and observatory still count it); the
    // map simply does not repeat a claim it cannot open.
    expect(detailed.media).toEqual(["Prototype"]);
    expect(detailOf(graph, "project-associated-project")).not.toHaveProperty("media");
  });
});

/**
 * M3.3.1, measured: the same pins as Task 3.1, now for the detail payload built
 * from the 22 projects as they exist right now.
 */
describe("Task 3.3 — real portfolio detail", () => {
  const skills = skillsData as SkillsData;
  const projects = projectsData.projects as Project[];
  const graph = buildSignalLoomGraph(projects, skills);
  const details = graph.nodes
    .filter((node) => node.kind === "project")
    .map((node) => node.detail as SignalLoomProjectDetail);

  it("gives every one of the 22 projects a detail payload", () => {
    expect(details).toHaveLength(22);
    expect(details.every((detail) => detail !== undefined)).toBe(true);
  });

  it("carries 23 links across the 19 projects that declare any", () => {
    const linkCount = details.reduce((sum, detail) => sum + detail.links.length, 0);
    expect(linkCount).toBe(23);
    expect(details.filter((detail) => detail.links.length > 0)).toHaveLength(19);
    // The three projects with no links carry the empty array, not a placeholder.
    expect(details.filter((detail) => detail.links.length === 0)).toHaveLength(3);
  });

  it("adds association only for the six projects that declare one", () => {
    expect(details.filter((detail) => detail.association !== undefined)).toHaveLength(6);
  });

  it("carries 43 skill instances across the map", () => {
    const skillCount = details.reduce((sum, detail) => sum + detail.skills.length, 0);
    expect(skillCount).toBe(43);
  });

  it("carries no media label anywhere, though four projects still hold them", () => {
    for (const detail of details) expect(detail).not.toHaveProperty("media");
    expect(projects.filter((project) => (project.media ?? []).length > 0)).toHaveLength(4);
  });
});

/**
 * MOTION-05 (M5.1) — the default narrative path.
 *
 * The section must explain the map before a click, and that sentence has to be
 * the map: the capability it names is the one the island selects, the count is
 * the number of edges incident to it, and the steps are the heaviest of those
 * edges in the order the entry choreography (M5.2) draws them. Nothing here is
 * typed copy — every field comes from `buildSignalLoomGraph`.
 */
describe("MOTION-05 — default narrative path", () => {
  const fixtureSkills: SkillsData = {
    categories: [
      { name: "Machine Learning & AI", icon: "brain", skills: [{ name: "Machine Learning", proficiency: 5 }] },
      { name: "Web Development", icon: "code", skills: [{ name: "React.js", proficiency: 3 }] },
    ],
  };
  const fixtureProjects: Project[] = [
    {
      title: "Light Overlap",
      category: "ml",
      period: "2026",
      description: "Shares one skill.",
      links: [],
      skills: ["Machine Learning"],
    },
    {
      title: "Heavy Overlap",
      category: "ml",
      period: "2026",
      description: "Shares two skills.",
      links: [],
      skills: ["Machine Learning", "Python"],
    },
    {
      title: "Heaviest Overlap",
      category: "ml",
      period: "2025",
      description: "Shares all three skills.",
      links: [],
      skills: ["Machine Learning", "Python", "Deep Learning"],
    },
    {
      title: "Web Only",
      category: "web",
      period: "2026",
      description: "Belongs to another capability.",
      links: [],
      skills: ["React.js"],
    },
  ];
  const heavySkills: SkillsData = {
    categories: [
      {
        name: "Machine Learning & AI",
        icon: "brain",
        skills: [
          { name: "Machine Learning", proficiency: 5 },
          { name: "Python", proficiency: 5 },
          { name: "Deep Learning", proficiency: 5 },
        ],
      },
      { name: "Web Development", icon: "code", skills: [{ name: "React.js", proficiency: 3 }] },
    ],
  };

  it("names the capability the map opens on and counts its real edges", () => {
    const graph = buildSignalLoomGraph(fixtureProjects, fixtureSkills);
    const narrative = defaultNarrative(graph);

    expect(narrative).not.toBeNull();
    expect(narrative?.capabilityId).toBe(graph.defaultNodeId);
    expect(narrative?.capabilityLabel).toBe("Machine Learning & AI");
    expect(narrative?.connectedProjects).toBe(3);
  });

  it("orders steps by overlap weight, breaking ties with graph order", () => {
    const graph = buildSignalLoomGraph(fixtureProjects, heavySkills);
    const narrative = defaultNarrative(graph);

    expect(narrative?.steps.map((step) => step.weight)).toEqual([3, 2, 1]);
    expect(narrative?.steps.map((step) => step.label)).toEqual([
      "Heaviest Overlap",
      "Heavy Overlap",
      "Light Overlap",
    ]);
    // The href is the real project page, resolved by the same rule the cards use.
    const first = fixtureProjects.find((project) => project.title === "Heaviest Overlap");
    expect(narrative?.steps[0].id).toBe(`project-${"heaviest-overlap"}`);
    expect(narrative?.steps[0].href).toBe(first ? projectHref(first) : "");
  });

  it("caps the named steps without shrinking the connected count", () => {
    const graph = buildSignalLoomGraph(fixtureProjects, heavySkills);

    expect(defaultNarrative(graph, 2)?.steps).toHaveLength(2);
    expect(defaultNarrative(graph, 2)?.connectedProjects).toBe(3);
    // A limit below one would render an empty list; clamp to one step instead of
    // returning a narrative with nothing in it.
    expect(defaultNarrative(graph, 0)?.steps).toHaveLength(1);
    expect(defaultNarrative(graph, -5)?.steps).toHaveLength(1);
  });

  it("falls back to the most connected capability when the default node is a project", () => {
    const graph = buildSignalLoomGraph(fixtureProjects, fixtureSkills);
    const projectDefault: SignalLoomGraph = {
      ...graph,
      defaultNodeId: "project-light-overlap",
    };

    expect(defaultNarrative(projectDefault)?.capabilityId).toBe(
      "capability-machine-learning-ai",
    );
  });

  it("returns null when there is no story to tell", () => {
    const orphanProject: Project = {
      title: "Orphan",
      category: "cli",
      period: "2026",
      description: "Shares no declared skill.",
      links: [],
      skills: ["Rust"],
    };
    const graph = buildSignalLoomGraph([orphanProject], fixtureSkills);

    expect(graph.edges).toEqual([]);
    expect(defaultNarrative(graph)).toBeNull();
    expect(defaultPathEdgeIds(graph)).toEqual([]);
  });

  it("orders the entry path the way the narrative reads", () => {
    const graph = buildSignalLoomGraph(fixtureProjects, heavySkills);

    expect(defaultPathEdgeIds(graph)).toEqual([
      "capability-machine-learning-ai->project-heaviest-overlap",
      "capability-machine-learning-ai->project-heavy-overlap",
      "capability-machine-learning-ai->project-light-overlap",
    ]);
  });
});

/**
 * The same narrative on the 22 projects as they exist now. These are
 * measurement pins, not copy: if the data changes, the sentence changes, and
 * these numbers must change with it.
 */
describe("MOTION-05 — real portfolio narrative", () => {
  const skills = skillsData as SkillsData;
  const projects = projectsData.projects as Project[];
  const graph = buildSignalLoomGraph(projects, skills);
  const narrative = defaultNarrative(graph);

  it("opens on the Machine Learning & AI hub with its nine projects", () => {
    expect(narrative?.capabilityId).toBe("capability-machine-learning-ai");
    expect(narrative?.connectedProjects).toBe(9);
    expect(narrative?.steps).toHaveLength(3);
  });

  it("names the three heaviest ties, all two shared skills", () => {
    expect(narrative?.steps.map((step) => step.weight)).toEqual([2, 2, 2]);
    const labels = narrative?.steps.map((step) => step.label) ?? [];
    // The label is the node label the map renders — no shortened copy invented
    // for the narrative.
    expect(labels).toEqual([
      "TemuSehat ADK – Herbal AI Agent for Early Symptom Triage",
      "Pathwise Career AI: Personalized Guidance Through Data-Driven Insights",
      "SweetLife Mobile App – AI-Powered Wellness & Diabetes-Friendly Lifestyle Companion",
    ]);
  });

  it("keeps every step anchored to the node the map renders", () => {
    const nodeIds = new Set(graph.nodes.map((node) => node.id));
    for (const step of narrative?.steps ?? []) {
      expect(nodeIds.has(step.id)).toBe(true);
      expect(step.href.startsWith("/work/")).toBe(true);
    }
  });

  it("orders the whole default path by weight, not by edge list order", () => {
    const pathIds = defaultPathEdgeIds(graph);
    expect(pathIds).toHaveLength(9);
    const weights = pathIds.map(
      (id) => graph.edges.find((edge) => edge.id === id)?.weight ?? 0,
    );
    expect([...weights].sort((a, b) => b - a)).toEqual(weights);
    // The first three are exactly the steps the narrative names.
    expect(pathIds.slice(0, 3)).toEqual(
      (narrative?.steps ?? []).map((step) => `capability-machine-learning-ai->${step.id}`),
    );
  });
});
