var graphBehavior = function() {
    var canvas = document.getElementById('graph_behavior');
    var ctx = canvas.getContext('2d');

    this.background_color = "#333333";
    const startX = 15;
    const graph_Y_step = canvas.height / 4;
    const graph_width  = canvas.width - startX - 15;
    const graph_height = Math.floor(graph_Y_step * 0.75);

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.setLineDash([0]);

    for (var i=0; i<4; i++) {
        const startY = Math.floor(graph_Y_step * i);

        ctx.strokeStyle = this.background_color;
        ctx.fillStyle = this.background_color;
        ctx.fillRect(startX, startY, graph_width, graph_height);
        ctx.stroke();
    }

    ctx.closePath();
};

graphBehavior.prototype.push = function(position) {

};

graphBehavior.prototype.plot = function() {
    var canvas = document.getElementById('graph_behavior');
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
};
