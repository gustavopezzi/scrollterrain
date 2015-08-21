$(document).ready(function() {
    $('body').hide().fadeIn('slow');

    var weatherMode = (Math.random() < 0.5)? 1 : 2;

    var keysDown = {};

    window.addEventListener('keydown', function(e) {
        keysDown[e.keyCode] = true;
    });
    
    window.addEventListener('keyup', function(e) {
        delete keysDown[e.keyCode];
        aircraft.angle = 0;
    });
     
    function Terrain2D(height, width, startY, spacing, max, jitter) {
        this.height = height;
        this.width = width;
        this.jitter = jitter;
        this.points = [];
        this.spacing = spacing;
        this.num_points = width / spacing | 0;
        this.scale_x = width / this.num_points;
        
        for (var i = 0; i <= this.num_points; i++)
            this.points[i] = startY;
        
        this.midpoint.call(this, 0, this.num_points, max);
    }
    
    Terrain2D.prototype = {
        constructor: Terrain2D,
        
        midpoint: function(p1, p2, max) {
            var mid = Math.round((p1 + p2) / 2);
            
            if (p2 - p1 <= 1 || p2 === mid || p1 === mid)
                return;
            
            this.points[mid] = ((this.points[p1] + this.points[p2]) / 2) + (max * (Math.random() * (this.jitter * 2) - this.jitter));
            this.midpoint.call(this, p1, mid, max/2);
            this.midpoint.call(this, mid, p2, max/2);
        },
        
        render: function(context, x, y, color, opacity) {
            var i = 0;
            
            if (typeof opacity !== 'undefined')
                context.globalAlpha = opacity;
            
            context.save();
            context.translate(x, y);
            context.beginPath();
            context.moveTo(0, this.points[0]);
            
            for (; i < this.num_points - 1; i += 2) {
                context.lineTo(i * this.scale_x, this.points[i]);
                context.lineTo((i + 1) * this.scale_x, this.points[i + 1]);
            }
            
            context.lineTo(this.width, this.points[0]);
            context.lineTo(this.width, this.height);
            context.lineTo(0, this.height);
            
            context.fillStyle = color;
            
            context.fill();
            context.closePath();
            context.restore();
        }
    };
    
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    var tcanvas = document.createElement('canvas');
    var tcontext = tcanvas.getContext('2d');
    var floor = document.body.offsetHeight - 50;
    var height, width, slices, xoffset, changed;
    var uspeed = 1000 / 60;
    var settings = {
        xspeed: 20,
        slice_size: 400,
        height_deviation: 80,
        start_height: 0,
        terrainColor: '#000000'
    };
    
    var airplaneImg = new Image();
    var shadowImg = new Image();
    
    var aircraft = {
        x: document.body.offsetWidth / 4,
        y: document.body.offsetHeight / 3,
        width: 100,
        height: 20,
        speed: 100,
        pitchFactor: 0.008,
        accelerationFactor: 0.02
    };

    var shadow = {
        x: aircraft.x,
        y: floor,
        width: 100,
        height: 20
    };

    setTimeout(init, 100);

    function init() {
        height = canvas.height = tcanvas.height = document.body.offsetHeight;
        width = canvas.width = tcanvas.width = document.body.offsetWidth;
        settings.slice_size = width / 3.5;
        settings.start_height = height / 3;
        play();
    }

    function play() {
        changed = false;
        slices = [];
        xoffset = 0;

        for (var i = 0; i < (width / settings.slice_size) + 2; i++)
            generate();

        update();
        render();
    }

    function changing() {
        changed = true;
    }

    function generate() {
        slices.push(new Terrain2D(height, settings.slice_size + 1, height - settings.start_height, 4, settings.height_deviation, 1));
        updateWeatherScene();
    }

    function update(mod) {
        // up arrow
        if (38 in keysDown && aircraft.y > 0)
            aircraft.y -= aircraft.speed * aircraft.pitchFactor;
        
        // down arrow
        if (40 in keysDown && aircraft.y < floor - aircraft.height)
            aircraft.y += aircraft.speed * aircraft.pitchFactor;

        aircraft.speed = canvas.height/2 - Math.abs(aircraft.y - canvas.height/2);

        // left arrow
        if (37 in keysDown && aircraft.x > 0)
            aircraft.x -= 40 * aircraft.accelerationFactor;
        
        // right arrow
        if (39 in keysDown && aircraft.x < canvas.width - aircraft.width)
            aircraft.x += 40 * aircraft.accelerationFactor;

        // key 1 (day)
        if (49 in keysDown) {
            weatherMode = 1;
            updateWeatherScene();
        }

        // key 2 (night)
        if (50 in keysDown) {
            weatherMode = 2;
            updateWeatherScene();
        }

        shadowImg.src = 'img/shadow.png';
        shadow.x = aircraft.x;
        shadow.width = 100 + ((canvas.height / aircraft.y) * 10);

        if (changed)
            return;

        for (var i = 0, l = slices.length; i < l; i++) {
            xoffset -= settings.xspeed / 100;

            if (xoffset < -settings.slice_size) {
                slices.splice(0, 1);
                generate();
                xoffset = 0;
            }
        }

        setTimeout(update, uspeed);
    }

    function updateWeatherScene() {
        // day
        if (weatherMode == 1) {
            $('body').css('background', 'linear-gradient(to bottom, #2c7de0 10%, #efe481 100%)');
            airplaneImg.src = 'img/f16.png';
            settings.terrainColor = '#021704';
        }

        // night
        if (weatherMode == 2) {
            $('body').css('background', 'linear-gradient(to bottom, #111A20 20%, #59230B 100%');
            airplaneImg.src = 'img/f117.png';
            settings.terrainColor = '#000000';
        }
    }

    function render() {
        if (changed)
            return;

        context.clearRect(0, 0, width, height);

        for (var i = 0, l = slices.length; i < l; i++)
            slices[i].render(context, i * settings.slice_size + xoffset + 1, 1, settings.terrainColor);

        context.drawImage(airplaneImg, aircraft.x, aircraft.y, aircraft.width, aircraft.height);
        context.drawImage(shadowImg, shadow.x, shadow.y, shadow.width, shadow.height);
        
        requestAnimationFrame(render);
    }

    window.requestAnimationFrame = (function() {
        return window.requestAnimationFrame    ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            function(callback) {
                window.setTimeout(callback, 1000/60);
            };
    })();
});