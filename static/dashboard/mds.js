
document.addEventListener('DOMContentLoaded', function() {
    fetch('/mds', {
    })
    .then(response => response.json())
    .then(data => { 
        var X_pca = data.X_pca;
        var cluster_labels = data.cluster_labels;
        var feature_names = data.feature_names
        var X_pca1 = data.X_pca1;
        drawMDS_Data(X_pca, cluster_labels, feature_names)
        drawMDS_Var(X_pca1, cluster_labels, feature_names)
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });

    function drawMDS_Data(X_pca, cluster_labels, feature_names){
        d3.select('#MDS1').selectAll('*').remove();
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        const margin = { top: 30, right: 10, bottom: 60, left: 70 };
        const width = 600 - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;

        const xdomain = d3.extent(X_pca, d => d[0]);
        const ydomain = d3.extent(X_pca, d => d[1]);
        const xScale = d3.scaleLinear().domain(xdomain).nice().range([0, width]);
        const yScale = d3.scaleLinear().domain(ydomain).nice().range([height, 0]);

        const svg = d3.select("#MDS1")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        
        svg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale).ticks(10).tickSize(-height).tickFormat(''));

        svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(yScale).ticks(10).tickSize(-width).tickFormat(''));

        
        svg.selectAll(".point")
            .data(X_pca)
            .enter().append("circle")
            .attr("class", "point")
            .attr("cx", d => xScale(d[0]))
            .attr("cy", d => yScale(d[1]))
            .attr("r", 5)
            .attr("fill", (d, i) => colorScale(cluster_labels[i]));

            

        svg.selectAll(".tick line")
            .style("stroke", "#999") 
            .style("stroke-dasharray", "2,2");
        
        svg.selectAll(".tick")
            .filter(function(d) { return d === 0; })  
            .select("text")
            .style("font-weight", "bold") 
            .style("fill", "black")
            
        svg.selectAll(".domain")
            .style("stroke", "#000") 
            .style("stroke-width", "1");


        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale));

    
        svg.append("g")
            .call(d3.axisLeft(yScale));

        
        svg.append("text")
            .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 20})`)
            .style("text-anchor", "middle")
            .text("MDS1");

    
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("MDS2");

        
        let legendHeight = margin.top;

        feature_names.forEach((name, i) => {
            const color = colorScale(i);

        
            svg.append("rect")
                .attr("x", margin.left-50)
                .attr("y", legendHeight)
                .attr("width", 10)
                .attr("height", 10)
                .style("fill", color);

        
            svg.append("text")
                .attr("x", margin.left-40)
                .attr("y", legendHeight+5)
                .text(name)
                .style("font-size", "12px")
                .attr("alignment-baseline", "middle");

            legendHeight += 20;
        });
    }

    function drawMDS_Var(X_pca1, cluster_labels, feature_names){
        d3.select('#MDS2').selectAll('*').remove();
        // const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
        const colorScale = d3.scaleOrdinal()
        .domain(feature_names) // domain is set to the list of feature names
        .range(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b']);

        const margin = { top: 30, right: 10, bottom: 60, left: 70 };
        const width = 600 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const xdomain = d3.extent(X_pca1, d => d[0]);
        const ydomain = d3.extent(X_pca1, d => d[1]);
        const xScale = d3.scaleLinear().domain(xdomain).nice().range([0, width]);
        const yScale = d3.scaleLinear().domain(ydomain).nice().range([height, 0]);

        const svg = d3.select("#MDS2")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        
        svg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale).ticks(10).tickSize(-height).tickFormat(''));

        svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(yScale).ticks(10).tickSize(-width).tickFormat(''));

        var tooltip = d3.select("#MDS2").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("padding", "4px")
            .style("background", "lightsteelblue")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("font-size", "18px");
            
        svg.selectAll(".point")
            .data(X_pca1)
            .enter().append("circle")
            .attr("class", "point")
            .attr("cx", d => xScale(d[0]))
            .attr("cy", d => yScale(d[1]))
            .attr("r", 7)
            .attr("fill", (d, i) => colorScale(feature_names[i]))
            .attr("ID", (d,i) => i)
            .on("click", function(event,d) {
                if(click === 6){
                    click = 0;
                    click_order = []
                    svg.selectAll(".click-text").remove();
                }
                click+=1;
                console.log(click);
                id = +d3.select(this).attr("ID");
                click_order.push(feature_names[id])
            svg.append("text")
                .attr("class", "click-text")
                .attr("x", xScale(d[0]) - 12) 
                .attr("y", yScale(d[1]) - 15)
                .text(click)
                .style("fill", "black")
                .style("font-size", "12px")
                .style("pointer-events", "none");

            if(click === 6){
                fetch('/pcp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({selected_MSEBarIndex: selected_MSEBarIndex })
                })
                .then(response => response.json())
                .then(data => {
                    var columns = data.columns;
                    var cluster_labels = data.cluster_labels
                    var col_names = data.col_names
                    click_order.push("Country");
                    click_order.push("created_year");
                    click_order.push("category");
                    click_order.push("channel_type");
                    drawPcp(columns, cluster_labels, click_order);
                })
            }

            })
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("r", 10)
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(feature_names[X_pca1.indexOf(d)])
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                d3.select(this)
                    .attr("r", 7)


                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });           

        svg.selectAll(".tick line")
            .style("stroke", "#999") 
            .style("stroke-dasharray", "2,2");
        
        svg.selectAll(".tick")
            .filter(function(d) { return d === 0; })  
            .select("text")
            .style("font-weight", "bold") 
            .style("fill", "black")
            
        svg.selectAll(".domain")
            .style("stroke", "#000") 
            .style("stroke-width", "1");


        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale));

    
        svg.append("g")
            .call(d3.axisLeft(yScale));

        
        svg.append("text")
            .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 20})`)
            .style("text-anchor", "middle")
            .text("MDS1");

    
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("MDS2");

        d3.selectAll(".tooltip")
            .style("color", "black")
            .style("font-weight", "bold");
        
        let legendHeight = margin.top;

        feature_names.forEach((name, i) => {
            const color = colorScale(name);

        
            svg.append("rect")
                .attr("x", width + margin.right-150)
                .attr("y", legendHeight)
                .attr("width", 10)
                .attr("height", 10)
                .style("fill", color);

        
            svg.append("text")
                .attr("x", width + margin.right-140)
                .attr("y", legendHeight+5)
                .text(name)
                .style("font-size", "12px")
                .attr("alignment-baseline", "middle");

            legendHeight += 20;
        });
    }
});