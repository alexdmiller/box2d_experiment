(function() {
  var b2Vec2 = Box2D.Common.Math.b2Vec2;
  var b2AABB = Box2D.Collision.b2AABB;
  var b2BodyDef = Box2D.Dynamics.b2BodyDef;
  var b2Body = Box2D.Dynamics.b2Body;
  var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
  var b2Fixture = Box2D.Dynamics.b2Fixture;
  var b2World = Box2D.Dynamics.b2World;
  var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
  var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
  var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

  var SCALE = 30, STEP = 20, TIMESTEP = 1 / STEP;

  $(document).ready(function() {
    var app = new App();
    $("#canvas").mousedown(function(event) { app.onMouseDown(event) });
    $("#canvas").mouseup(function(event) { app.onMouseUp(event) });
    $("#canvas").mousemove(function(event){ app.onMouseMove(event) }); 
    $(document).keypress(function(event) {
      if (event.keyCode == 32) {
        app.toggleState();
      }
    });
    // remove when done. temporary for debugging.
    window.debug_app = app;
  });


  function App() {
    this.canvas = $("#canvas")[0];
    this.canvas.width = $(document).width();
    this.canvas.height = $(document).height();
    this.ctx = this.canvas.getContext("2d");
    this.stage = new createjs.Stage(canvas);
    this.box2d = new Box2DSim();
    this.actors = [];
    this.forces = [];
    this.state = "running";

    this.objects = new createjs.Container();
    this.stage.addChild(this.objects);

    this.gui = new createjs.Shape();
    this.stage.addChild(this.gui);

    var debugDraw = new Box2D.Dynamics.b2DebugDraw;
    debugDraw.SetSprite(this.ctx);
    debugDraw.SetDrawScale(30.0);
    debugDraw.SetFillAlpha(0.5);
    debugDraw.SetLineThickness(1.0);
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
    this.box2d.world.SetDebugDraw(debugDraw);

    this.makeBorders();

    // create obstacles
    this.makeFixedBox(this.canvas.width / 2,
        this.canvas.height / 2 + this.canvas.height / 5,
        this.canvas.width / 3, 50);
    this.makeFixedBox(this.canvas.width / 2 - this.canvas.width / 4,
        this.canvas.height / 3,
        this.canvas.width / 5, 50);
    var a = this.makeFixedBox(this.canvas.width - this.canvas.width / 4,
        this.canvas.height / 3,
        this.canvas.width / 5, 50);
    a.setAngle(-0.5);

    // create dynamic objects
    for (var i = 0; i < 6; i++) {
      this.makeBox(Math.random() * this.canvas.width,
                   Math.random() * this.canvas.height,
                   Math.random() * 50 + 40,
                   Math.random() * 50 + 40);
    }

    createjs.Ticker.setFPS(50);
    createjs.Ticker.addListener(this);
  }

  App.prototype.toggleState = function() {
    if (this.state == "paused") {
      this.flushForces();
      this.state = "running";
      for (var i = 0; i < this.actors.length; i++) {
        this.actors[i].skin.alpha = 1;
      }
    } else {
      this.state = "paused";
      for (var i = 0; i < this.actors.length; i++) {
        this.actors[i].skin.alpha = 0.5;
      }
    }
  }

  App.prototype.onMouseMove = function(event) {
    this.mouse = {x: event.offsetX, y: event.offsetY};
  }

  App.prototype.onMouseDown = function(event) {
    if (this.state == "paused") {
      var clickedBody = this.box2d.getBodyAtCoords(event.offsetX, event.offsetY);
      if (clickedBody) {
        this.clicked = {
          x: event.offsetX,
          y: event.offsetY,
          body: clickedBody
        };
      }      
    }
  }

  App.prototype.onMouseUp = function(event) {
    if (this.clicked) {
      this.forces.push({
        body: this.clicked.body,
        startX: this.clicked.x,
        startY: this.clicked.y,
        endX: event.offsetX,
        endY: event.offsetY
      });
      this.clicked = null;
    }
  }

  App.prototype.flushForces = function() {
    for (var i = 0; i < this.forces.length; i++) {
      var f = this.forces[i];
      var dx = f.endX - f.startX;
      var dy =  f.endY - f.startY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var angle = Math.atan2(dy, dx);
      var force = new b2Vec2(Math.cos(angle) * dist / 3, Math.sin(angle) * dist / 3);
      var point = new b2Vec2(f.startX / SCALE, f.startY / SCALE);
      f.body.ApplyImpulse(force, point);
    }
    this.forces = [];
  }

  App.prototype.tick = function() {
    this.gui.graphics.clear();
    if (this.state == "paused") {
      this.gui.graphics.setStrokeStyle(2);
      this.gui.graphics.beginStroke("#FF0000");
      for (var i = 0; i < this.forces.length; i++) {
        var f = this.forces[i];
        this.gui.graphics.moveTo(f.startX, f.startY);
        this.gui.graphics.lineTo(f.endX, f.endY);
      }
      if (this.clicked) {
        this.gui.graphics.moveTo(this.clicked.x, this.clicked.y);
        this.gui.graphics.lineTo(this.mouse.x, this.mouse.y);
      }
    } else if (this.state == "running") {
      this.box2d.world.Step(TIMESTEP, 10, 10);
      for (var i = 0; i < this.actors.length; i++) {
        this.actors[i].tick();
      }
    }
    this.stage.update();
    // this.box2d.world.DrawDebugData()
  }

  App.prototype.makeBorders = function() {
    // top
    this.makeFixedBox(this.canvas.width / 2, 0, this.canvas.width, 20);
    // bottom
    this.makeFixedBox(this.canvas.width / 2, this.canvas.height, this.canvas.width, 20);
    // left
    this.makeFixedBox(0, this.canvas.height / 2, 20, this.canvas.height);
    // right    
    this.makeFixedBox(this.canvas.width, this.canvas.height / 2, 20, this.canvas.height);
  }

  App.prototype.makeFixedBox = function(x, y, w, h) {
    var body = this.box2d.createFixedBox(x, y, w, h);
    
    var skin = new createjs.Shape();
    skin.graphics.beginFill('#999999');
    skin.graphics.drawRect(-w / 2, -h / 2, w, h);
    this.objects.addChild(skin);
    
    var actor = new Actor(body, skin);
    actor.setPosition(x, y);
    this.actors.push(actor);
    return actor;
  }

  App.prototype.makeBox = function(x, y, w, h) {
    var body = this.box2d.createBoxBody(w, h);
    
    var skin = new createjs.Shape();
    skin.graphics.beginFill('#000000');
    skin.graphics.drawRect(-w / 2, -h / 2, w, h);
    this.objects.addChild(skin);
    
    var actor = new Actor(body, skin);
    actor.setPosition(x, y);
    actor.tick();
    this.actors.push(actor);
    return actor;
  }


  function Actor(body, skin) {
    this.body = body;
    this.skin = skin;
    this.tick();
  }

  Actor.prototype.tick = function() {
    this.skin.rotation = this.body.GetAngle() * (180 / Math.PI);
    this.skin.x = this.body.GetWorldCenter().x * SCALE;
    this.skin.y = this.body.GetWorldCenter().y * SCALE;
  }

  Actor.prototype.setPosition = function(x, y) {
    this.body.SetPositionAndAngle(new b2Vec2(x / SCALE, y / SCALE));
  }

  Actor.prototype.setAngle = function(angle) {
    this.body.SetPositionAndAngle(this.body.GetPosition(), angle);
  }


  function Box2DSim() {
    this.world = new b2World(new b2Vec2(0, 5), true);
  }

  Box2DSim.prototype.createFixedBox = function(x, y, width, height) {
    var fixDef = new b2FixtureDef();
    fixDef.shape = new b2PolygonShape();
    fixDef.shape.SetAsBox(width / 2 / SCALE, height / 2 / SCALE);
    var boxBodyDef = new b2BodyDef();
    boxBodyDef.position.x = x / SCALE;
    boxBodyDef.position.y = y / SCALE;
    var boxBody = this.world.CreateBody(boxBodyDef);
    boxBody.CreateFixture(fixDef);
    return boxBody;
  }

  Box2DSim.prototype.createBoxBody = function(width, height) {
    var fixDef = new b2FixtureDef();
    fixDef.density = 1;
    fixDef.friction = 0.5;
    fixDef.restitution = 0.6;
    fixDef.shape = new b2PolygonShape();
    fixDef.shape.SetAsBox(width / 2 / SCALE, height / 2 / SCALE);
    var boxBodyDef = new b2BodyDef();
    boxBodyDef.type = b2Body.b2_dynamicBody;
    boxBodyDef.angularDamping = 0.8;
    boxBodyDef.linearDamping = 0.4;
    var boxBody = this.world.CreateBody(boxBodyDef);
    boxBody.CreateFixture(fixDef);
    return boxBody;
  }

  Box2DSim.prototype.getBodyAtCoords = function(x, y) {
    var aabb = new b2AABB();
    aabb.lowerBound.Set(x / SCALE - 0.001, y / SCALE - 0.001);
    aabb.upperBound.Set(x / SCALE + 0.001, y / SCALE + 0.001);    
    var mouseVec = new b2Vec2(x / SCALE, y / SCALE);
    var selectedBody = null;
    this.world.QueryAABB(function (fix) {
      if (fix.GetBody().GetType() != b2Body.b2_staticBody) {
        if (fix.GetShape().TestPoint(fix.GetBody().GetTransform(), mouseVec)) {
          selectedBody = fix.GetBody();
          return false;
        }
      }
      return true;
    }, aabb);
    return selectedBody;
  }
})();

