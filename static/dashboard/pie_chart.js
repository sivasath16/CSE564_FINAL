document.addEventListener('DOMContentLoaded', function () {
    const dropdowns = document.querySelectorAll('.dropdown');
    let selectionSource = 'dropdown'; // Default source

    dropdowns.forEach(dropdown => {
        const select = dropdown.querySelector('.select');
        const caret = dropdown.querySelector('.caret');
        const menu = dropdown.querySelector('.menu');
        const options = dropdown.querySelectorAll('.menu li');
        const selected = dropdown.querySelector('.selected');

        select.addEventListener('click', () => {
            select.classList.toggle('select-clicked');
            caret.classList.toggle('caret-rotate');
            menu.classList.toggle('menu-open');
        });

        options.forEach(option => {
            option.addEventListener('click', () => {
                selected.innerText = option.innerText;
                selected.classList.add("text-fade-in");
                setTimeout(() => {
                    selected.classList.remove("text-fade-in");
                }, 300);

                select.classList.remove('select-clicked');
                caret.classList.remove('caret-rotate');
                menu.classList.remove('menu-open');

                options.forEach(option => {
                    option.classList.remove('active');
                });

                option.classList.add('active');
                selectedCountry = selected.innerText;
                selectionSource = 'dropdown'; // Update selection source
                updateChart(selectedCountry);
            });
        });

        window.addEventListener("click", e => {
            const size = dropdown.getBoundingClientRect();
            if(e.clientX < size.left || e.clientX > size.right || e.clientY < size.top || e.clientY > size.bottom) {
                select.classList.remove('select-clicked');
                caret.classList.remove('caret-rotate');
                menu.classList.remove('menu-open');
            }
        });
    });

    let selectedCountry = "Afghanistan";
    let selectedYear = 1990;
    document.getElementById("yearSlider").addEventListener("input", function () {
        selectedYear = +this.value;
        document.getElementById("sliderValue").innerText = selectedYear;
        updateChart(selectedCountry);
    });

    document.addEventListener('countrySelected', function (e) {
        selectedCountry = e.detail.countryName;
        selectionSource = 'file';
        updateChart(selectedCountry);
    });

    function updateChart(selectedCountry) {
        let tooltip2 = d3.select('body').append('div')
            .attr('class', 'd3-tooltip')
            .style('position', 'absolute')
            .style('z-index', '10')
            .style('visibility', 'hidden')
            .style('padding', '10px')
            .style('background', 'rgba(0, 0, 0, 0.6)')
            .style('border-radius', '4px')
            .style('color', 'white')
            .style('text-align', 'center')
            .style('font-family', 'sans-serif')
            .style('font-size', '12px')
            .style('pointer-events', 'none');
    
        d3.csv('/static/dataset/dataset.csv').then((data) => {
            let filteredData = data.find(row => row["Entity"] === selectedCountry && +row["Year"] === selectedYear);
            if (!filteredData) {
                console.warn(`No data found for ${selectedCountry} in ${selectedYear}`);
                return;
            }
    
            let ageGroups = [
                { label: "15-49 years", value: +filteredData["15-49 years"] },
                { label: "5-14 years", value: +filteredData["5-14 years"] },
                { label: "50-69 years", value: +filteredData["50-69 years"] },
                { label: "70+ years", value: +filteredData["70+ years"] },
                { label: "Under 5", value: +filteredData["Under 5"] }
            ];
    
            const pie = d3.pie().value(d => d.value);
            const arc = d3.arc().innerRadius(10).outerRadius(120);
            const arcHover = d3.arc().innerRadius(10).outerRadius(140);
    
            d3.select("#piechart").selectAll("*").remove();
            const svg = d3.select("#piechart").append("svg")
                .attr("width", 600)
                .attr("height", 400)
                .append("g")
                .attr("transform", "translate(200, 200)");
    
            const arcs = svg.selectAll("arc")
                .data(pie(ageGroups))
                .enter()
                .append("g")
                .attr("class", "arc")
                .attr("stroke", "white");
    
            const color = d3.scaleOrdinal(d3.schemeCategory10);
    
            arcs.append("path")
                .attr("d", arc)
                .attr("fill", (d, i) => color(i))
                .on("mouseover", function(e, d) {
                    d3.select(this).transition()
                        .duration(200)
                        .attr("d", arcHover);
                    tooltip2.style("visibility", "visible");
                })
                .on("mousemove", function(e, d) {
                    tooltip2.html(`Age Group: ${d.data.label}<br>Value: ${d.data.value}`)
                        .style("left", `${e.pageX + 10}px`)
                        .style("top", `${e.pageY - 28}px`);
                })
                .on("mouseout", function(d) {
                    d3.select(this).transition()
                        .duration(200)
                        .attr("d", arc);
                    tooltip2.style("visibility", "hidden");
                });
            const legend = svg.append("g")
                .attr("transform", "translate(50, 10)"); 
    
            legend.selectAll("rect")
                .data(ageGroups)
                .enter()
                .append("rect")
                .attr("x", 170) 
                .attr("y", (d, i) => i * 20)
                .attr("width", 10)
                .attr("height", 10)
                .style("fill", (d, i) => color(i));
    
            legend.selectAll("text")
                .data(ageGroups)
                .enter()
                .append("text")
                .attr("x", 190) 
                .attr("y", (d, i) => i * 20 + 9)
                .text(d => d.label)
                .style("font-size", "17px")
                .attr("text-anchor", "start")
                .style("alignment-baseline", "middle");
            
            
            const text = svg.append("g")
            text.append("text")
                .attr("y", 160)
                .attr("x", 0)
                .style("text-anchor", "middle")
                .text(`Seleceted Country: ${selectedCountry}`);

            });

    }

    
    updateChart(selectedCountry);
});
