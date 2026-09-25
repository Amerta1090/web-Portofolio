import { describe, expect, it } from "vitest";
import type { Project } from "../../types/projects";
import type { SkillsData } from "../../types/skills";
import { buildSignalLoomGraph, connectedNodeIds, mostConnectedNodeId } from "./signal-loom";

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
    description: "Should not enter the first graph.",
    links: [],
    skills: ["Machine Learning"],
  },
];

describe("buildSignalLoomGraph", () => {
  it("builds deterministic capability to featured-project edges", () => {
    const graph = buildSignalLoomGraph(projects, skills);

    expect(graph.nodes.map((node) => node.id)).toEqual([
      "capability-machine-learning-ai",
      "capability-web-development",
      "project-forecasting-system",
      "project-interface-system",
    ]);
    expect(graph.edges).toEqual([
      {
        id: "capability-machine-learning-ai->project-forecasting-system",
        from: "capability-machine-learning-ai",
        to: "project-forecasting-system",
        label: "Machine Learning",
      },
      {
        id: "capability-web-development->project-interface-system",
        from: "capability-web-development",
        to: "project-interface-system",
        label: "React.js",
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
      },
    ]);
  });

  it("links a broad project skill to a more specific category skill by shared token", () => {
    const categories: SkillsData = {
      categories: [
        {
          name: "Web Development",
          icon: "code",
          skills: [{ name: "Full-Stack Development", proficiency: 4 }],
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

    expect(graph.edges.map((edge) => edge.from)).toContain("capability-web-development");
    expect(graph.edges[0]?.label).toBe("Web Development");
  });

  it("returns the selected node and its direct neighbors", () => {
    const graph = buildSignalLoomGraph(projects, skills);
    expect([...connectedNodeIds(graph, "capability-machine-learning-ai")]).toEqual([
      "capability-machine-learning-ai",
      "project-forecasting-system",
    ]);
  });

  it("handles empty inputs without inventing a default node", () => {
    const graph = buildSignalLoomGraph([], { categories: [] });
    expect(graph).toEqual({ nodes: [], edges: [], defaultNodeId: "" });
    expect([...connectedNodeIds(graph, "missing")]).toEqual(["missing"]);
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
      { id: "hub->a", from: "hub", to: "a", label: "" },
      { id: "hub->b", from: "hub", to: "b", label: "" },
      { id: "a->b", from: "a", to: "b", label: "" },
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
