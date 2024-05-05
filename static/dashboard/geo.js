document.addEventListener('DOMContentLoaded', function () {
    const margin = {top: 5, right: 30, bottom: 120, left: 100},
        width = 1000 - margin.left - margin.right,
        height = 550 - margin.top - margin.bottom;

    const svg = d3.select("#geomap")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const projection = d3.geoNaturalEarth1()
        .scale(140)
        .translate([width / 2, height / 2]);

    const pathGenerator = d3.geoPath().projection(projection);

    const colorScale = d3.scaleSequential((t) => d3.interpolateReds(t * 1))
        .domain([0, 10]);

    let tooltip1 = d3.select("body").append("div")
        .attr("class", "tooltip1")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("padding", "10px")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px");

    let countries, countryDataMap;

    function updateMap(year) {
        countries.forEach(country => {
            const countryYearKey = `${country.properties.name}_${year}`;
            const deathRate = countryDataMap.get(countryYearKey);

            country.properties.deathRate = deathRate; 
        });

        svg.selectAll(".country")
            .data(countries)
            .attr("fill", d => {
                const deathRate = d.properties.deathRate;
                return deathRate !== undefined ? colorScale(deathRate) : "#eee"; // Default color for missing data
            });
    }

    d3.json("https://unpkg.com/world-atlas@2.0.2/countries-50m.json").then(worldData => {
        d3.csv("/static/dataset/dataset.csv").then(csvData => {
            const aggregatedData = d3.rollup(
                csvData,
                rows => d3.mean(rows, d => +d["death rates"]), 
                d => d.Entity, 
                d => d.Year    
            );

            countryDataMap = new Map();
            aggregatedData.forEach((yearMap, country) => {
                yearMap.forEach((value, year) => {
                    countryDataMap.set(`${country}_${year}`, value);
                });
            });

            countries = topojson.feature(worldData, worldData.objects.countries).features;
            countries = countries.filter(country => country.properties.name !== "Antarctica");

            svg.selectAll(".country")
                .data(countries)
                .enter().append("path")
                .attr("class", "country")
                .attr("d", pathGenerator)
                .style("stroke", "#000")
                .style("stroke-width", 0.5)
                .on("mouseover", function (event, d) {
                    const deathRate = d.properties.deathRate;
                    tooltip1.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip1.html(`Country: ${d.properties.name || "Unknown"}<br/>Death Rate: ${deathRate !== undefined ? deathRate.toFixed(2) + '%' : "No data"}`)
                        .style("left", (event.pageX - 50) + "px")
                        .style("top", (event.pageY - 70) + "px");
                })
                .on("mouseout", function () {
                    tooltip1.transition()
                        .duration(500)
                        .style("opacity", 0);
                });
            const initialYear = document.getElementById("yearSlider").value;
            updateMap(initialYear);

            document.getElementById("yearSlider").addEventListener("input", function () {
                const selectedYear = +this.value;
                updateMap(selectedYear);
                document.getElementById("sliderValue").textContent = selectedYear;
            });

        }).catch(error => {
            console.error("Error loading CSV data:", error);
        });
    }).catch(error => {
        console.error("Error loading world data:", error);
    });
});
