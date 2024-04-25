function geoMap() {
    d3.select("#geomap").html("");
    console.log('testing');

    const margin = { top: 10, right: 10, bottom: 10, left: 40 }; // Adjusted for smaller margins
    const width = 1000 - margin.left - margin.right; // Reduced width
    const height = 410 - margin.top - margin.bottom; // Reduced height

    const svg = d3
        .select("#geomap")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Adjust the projection scale and center it within the new dimensions
    const projection = d3.geoMercator()
        .scale((width + 1) / 2 / Math.PI)
        .translate([width / 2, height / 2 + 50]); // Centering the map

    const path = d3.geoPath().projection(projection);

    Promise.all([
        d3.json("https://public.opendatasoft.com/explore/dataset/world-administrative-boundaries/download/?format=geojson&timezone=Europe/Berlin"),
        d3.json("http://127.0.0.1:5000/cancer_data")
    ]).then(([geoData, cancerData]) => {
        const countries = topojson.feature(geoData, geoData.objects.countries);

        console.log(countries);

        // Add a color scale based on cancer data
        const colorScale = d3.scaleQuantize()
        .domain([
            d3.min(cancerData, d => d["Current number of cases of neoplasms per 100 people, in both sexes aged all ages"]),
            d3.max(cancerData, d => d["Current number of cases of neoplasms per 100 people, in both sexes aged all ages"])
        ])
        .range(["#fdd0a2","#fdae6b","#fd8d3c","#f16913","#d94801","#a63603","#7f2704"]); // Example range of orange/brown


        svg
            .selectAll(".country")
            .data(countries.features)
            .enter()
            .append("path")
            .attr("class", "country")
            .attr("d", path)
            .style("fill", (d) => {
                const countryData = cancerData.find((data) => data.Entity === d.properties.name);
                if (!countryData) {
                    return "gray"; // Color countries with missing data in gray
                }
                const cancerRate = countryData["Current number of cases of neoplasms per 100 people, in both sexes aged all ages"];
                return cancerRate ? colorScale(cancerRate) : "gray"; // Color countries with null/undefined cancer rate in gray
            })
            .style("stroke", "#fff")
            .style("stroke-width", 0.5)
            .style("stroke", "white")
            .on("mouseover", function(event, d) {
                const countryData = cancerData.find((data) => data.Entity === d.properties.name);
                if (countryData) {
                    const cancerRate = countryData["Current number of cases of neoplasms per 100 people, in both sexes aged all ages"];
                    d3.select(this)
                        .style("stroke", "black")
                        .style("stroke-width", 2)
                        .append("title")
                        .text(`${d.properties.name}: ${cancerRate}%`);
                }
            })
            .on("mouseout", function() {
                d3.select(this)
                    .style("stroke", "white")
                    .style("stroke-width", 1)
                    .select("title").remove();
            });

        // Add labels for countries
        svg
            .selectAll(".country-label")
            .data(countries.features)
            .enter()
            .append("text")
            .attr("class", "country-label")
            .attr("transform", (d) => `translate(${path.centroid(d)})`)
            .attr("dy", ".35em")
            .text((d) => d.properties.name);

        // Add a legend
        const legend = svg
            .append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - 200}, ${height - 200})`);

        const legendScale = d3
            .scaleLinear()
            .domain(colorScale.domain())
            .range([0, 200]);

        const legendAxis = d3
            .axisRight(legendScale)
            .tickSize(13)
            .tickValues(colorScale.range().slice(1).map((d, i) => colorScale.domain()[i]));

        legend
            .call(legendAxis)
            .select(".domain")
            .remove();

        legend
            .selectAll("rect")
            .data(colorScale.range().slice(1))
            .enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", (d, i) => -legendScale(colorScale.domain()[i]))
            .attr("width", 20)
            .attr("height", (d, i) => legendScale(colorScale.domain()[i + 1]) - legendScale(colorScale.domain()[i]))
            .attr("fill", (d) => d);

        legend
            .append("text")
            .attr("class", "caption")
            .attr("x", -10)
            .attr("y", -30)
            .attr("fill", "#000")
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text("Cancer Rate (%)");
    });
  }


document.addEventListener('DOMContentLoaded', function () {
    geoMap();
});


// 
