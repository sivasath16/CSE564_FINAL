document.addEventListener('DOMContentLoaded', function () {
    const dropdowns = document.querySelectorAll('.dropdown1');
    dropdowns.forEach(dropdown => {
        const select = dropdown.querySelector('.select1');
        const caret = dropdown.querySelector('.caret1');
        const menu = dropdown.querySelector('.menu1');
        const options = dropdown.querySelectorAll('.menu1 li');
        const selected = dropdown.querySelector('.selected1');

        select.addEventListener('click', () => {
            select.classList.toggle('select-clicked1');
            caret.classList.toggle('caret-rotate1');
            menu.classList.toggle('menu-open1');
        });

        options.forEach(option => {
            option.addEventListener('click', () => {
                selected.innerText = option.innerText;
                selected.classList.add("text-fade-in1");
                setTimeout(() => {
                    selected.classList.remove("text-fade-in1");
                }, 300);

                select.classList.remove('select-clicked1');
                caret.classList.remove('caret-rotate1');
                menu.classList.remove('menu-open1');
                options.forEach(o => o.classList.remove('active'));
                option.classList.add('active');

                updateMap(document.getElementById("yearSlider").value, option.innerText.trim());
            });
        });
    });

    let country = "Afghanistan"

    const margin = {top: 5, right: 30, bottom: 5, left: 20},
        width = 650 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const svgContainer = d3.select("#geomap")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("background-color", "white");

    const svg = svgContainer.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const projection = d3.geoNaturalEarth1()
        .scale(140)
        .translate([width / 2, height / 2]);

    const pathGenerator = d3.geoPath().projection(projection);

    let tooltip1 = d3.select("body").append("div")
        .attr("class", "tooltip1")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("padding", "10px")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px");

    let countries, countryDataMap;

    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", (event) => {
            svg.attr("transform", event.transform);
            svg.selectAll(".country")
                .style("stroke-width", 0.5 / event.transform.k);
        });

    svgContainer.call(zoom);

    // let lastSelectedCountry = null;


function updateMap(year, metric) {
    const metricKey = metric === "Neoplasm Rates" ? "neoplasm_rates" : "death_rates";
    const colorScale = d3.scaleSequential((t) => metric === "Neoplasm Rates" ? d3.interpolateBlues(t) : d3.interpolateReds(t))
        .domain([0, 10]);

    const countriesSelection = svg.selectAll(".country")
        .data(countries)
        .join("path")
        .attr("class", "country")
        .attr("d", pathGenerator)
        .attr("fill", d => {
            const countryYearKey = `${d.properties.name}_${year}_${metricKey}`;
            const rate = countryDataMap.get(countryYearKey);
            d.properties.rate = rate;
            return rate !== undefined ? colorScale(rate) : "#eee";
        })
        .style("stroke", "#000")
        .style("stroke-width", 0.5)
        .style("opacity", 1) // Reset opacity to full on update
        .on("mouseover", function (event, d) {
            tooltip1.style("opacity", 1)
                .html(`Country: ${d.properties.name}<br>${metric}: ${d.properties.rate ? d.properties.rate.toFixed(2) + '%' : 'No data'}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            tooltip1.style("opacity", 0);
        })
        .on("click", (event, d) => {
            // Reduce the opacity of all countries
            countriesSelection.style("opacity", 0.5);
            // Highlight the selected country by setting its opacity to full
            d3.select(event.currentTarget).style("opacity", 1);

            // Dispatch a custom event with the country name
            const countryEvent = new CustomEvent("countrySelected", {
                detail: {
                    countryName: d.properties.name
                }
            });
            document.dispatchEvent(countryEvent);
        });
}

    Promise.all([
        d3.json("https://unpkg.com/world-atlas@2.0.2/countries-50m.json"),
        d3.csv("/static/dataset/dataset.csv")
    ]).then(([worldData, csvData]) => {
        const aggregatedData = d3.rollup(
            csvData,
            rows => d3.mean(rows, d => +d["death rates"]),
            d => d.Entity, 
            d => d.Year
        );

        countryDataMap = new Map();
        aggregatedData.forEach((yearMap, country) => {
            yearMap.forEach((value, year) => {
                countryDataMap.set(`${country}_${year}_death_rates`, value);
            });
        });
        csvData.forEach(row => {
            countryDataMap.set(`${row.Entity}_${row.Year}_neoplasm_rates`, +row["Neoplasm rate"]);
        });

        countries = topojson.feature(worldData, worldData.objects.countries).features;
        countries = countries.filter(country => country.properties.name !== "Antarctica");

        const initialYear = document.getElementById("yearSlider").value;
        updateMap(initialYear, "Death Rates");
        document.getElementById("yearSlider").addEventListener("input", function () {
            const selectedYear = +this.value;
            updateMap(selectedYear, document.querySelector('.selected1').innerText.trim());
            document.getElementById("sliderValue").textContent = selectedYear;
        });
        document.getElementById('resetMapButton').addEventListener('click', function() {
            // Reset the opacity of all country paths to full
            svg.selectAll(".country").style("opacity", 1);
        });
    }).catch(error => {
        console.error("Error loading data:", error);
    });
});
