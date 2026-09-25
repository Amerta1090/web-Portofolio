import { describe, expect, it } from "vitest";
import type { Project } from "../../types/projects";
import type { SkillsData } from "../../types/skills";
import { buildSignalLoomGraph, connectedNodeIds } from "./signal-loom";

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
    expect(graph.defaultNodeId).toBe("project-forecasting-system");
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

