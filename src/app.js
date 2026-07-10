let currentMetric = "ai_exposure_score";

function setMetric(metric) {
  currentMetric = metric;
  render();
}

function getColor(d) {
  const m = d.data.metrics;
  if (!m) return "#ccc";

  if (currentMetric === "wage_tier") {
    return m.wage_tier === "High" ? "#084594" :
           m.wage_tier === "Med" ? "#4292c6" : "#9ecae1";
  }

  if (currentMetric === "education_tier") {
    return m.education_tier === "High" ? "#006d2c" :
           m.education_tier === "Med" || m.education_tier === "Med-High" ? "#41ab5d" : "#a1d99b";
  }

  if (currentMetric === "ai_exposure_score") {
    return d3.interpolateRdYlGn(1 - (m.ai_exposure_score / 10));
  }

  return "#ccc";
}

async function render() {
  const data = await d3.json("../data/site_data.json");
  d3.select("#chart").selectAll("*").remove();

  const width = document.getElementById("chart").clientWidth;
  const height = 700;

  const root = d3.hierarchy(data)
    .sum(d => d.value || 0)
    .sort((a, b) => b.value - a.value);

  d3.treemap()
    .size([width, height])
    .padding(2)(root);

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const tooltip = d3.select("#tooltip");

  const nodes = svg.selectAll("g")
    .data(root.leaves())
    .enter()
    .append("g")
    .attr("transform", d => `translate(${d.x0},${d.y0})`);

  nodes.append("rect")
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", d => getColor(d))
    .on("mousemove", (event, d) => {
      const m = d.data.metrics || {};
      tooltip
        .style("opacity", 1)
        .html(`
          <strong>${d.data.name}</strong><br>
          Sector: ${d.parent.data.name}<br>
          Employment: ${d.data.value ?? "Not published"}<br>
          Wage: ${m.wage_tier ?? "N/A"}<br>
          Education: ${m.education_tier ?? "N/A"}<br>
          AI Exposure: ${m.ai_exposure_score ?? "N/A"} (modeled estimate)<br>
          ${d.data.rationale ?? ""}
        `)
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY + 12) + "px");
    })
    .on("mouseleave", () => {
      tooltip.style("opacity", 0);
    });

  nodes.append("text")
    .attr("x", 4)
    .attr("y", 16)
    .attr("font-size", "12px")
    .attr("fill", "#111")
    .text(d => d.data.name);
}

render();
