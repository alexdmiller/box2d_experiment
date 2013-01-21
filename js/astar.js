(function() {
  var b2Vec2 = Box2D.Common.Math.b2Vec2;
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

    this.makeBorders();
    this.makeBox(100, 100);

    createjs.Ticker.setFPS(50);
    createjs.Ticker.addListener(this);    
  }

  App.prototype.tick = function() {
    this.box2d.world.Step(TIMESTEP, 10, 10);
    for (var i = 0; i < this.actors.length; i++) {
      this.actors[i].tick();
    }
    this.stage.update();
  }

  App.prototype.makeBorders = function() {
    this.box2d.createFixedBox(0, this.canvas.height + 20, this.canvas.width, 20);
  }

  App.prototype.makeBox = function(x, y) {
    var body = this.box2d.createBoxBody(20, 20);
    
    var skin = new createjs.Shape();
    skin.graphics.beginFill('#000000');
    skin.graphics.drawRect(0, 0, 20, 20);
    this.stage.addChild(skin);
    
    var actor = new Actor(body, skin);
    actor.setPosition(x, y);
    this.actors.push(actor);
  }


  function Actor(body, skin) {
    this.body = body;
    this.skin = skin;
  }

  Actor.prototype.tick = function() {
    this.skin.rotation = this.body.GetAngle() * (180 / Math.PI);
    this.skin.x = this.body.GetWorldCenter().x * SCALE;
    this.skin.y = this.body.GetWorldCenter().y * SCALE;
    console.log(this.skin.x, this.skin.y);    
  }

  Actor.prototype.setPosition = function(x, y) {
    this.body.SetPositionAndAngle(new b2Vec2(x / SCALE, y / SCALE));
  }


  function Box2DSim() {
    this.world = new b2World(new b2Vec2(0, 10), true);
  }

  Box2DSim.prototype.createFixedBox = function(x, y, width, height) {
    var fixDef = new b2FixtureDef();
    fixDef.shape = new b2PolygonShape();
    fixDef.shape.SetAsBox(width / SCALE, height / SCALE);
    var boxBodyDef = new b2BodyDef();
    boxBodyDef.position.x = x / SCALE;
    boxBodyDef.position.y = y / SCALE;
    var boxBody = this.world.CreateBody(boxBodyDef);
    boxBody.CreateFixture(fixDef);
    return boxBody;
  }

  Box2DSim.prototype.createBoxBody = function(width, height) {
    var fixDef = new b2FixtureDef();
    fixDef.shape = new b2PolygonShape();
    fixDef.restitution = 0.6;
    fixDef.shape.SetAsBox(width / SCALE, height / SCALE);
    var boxBodyDef = new b2BodyDef();
    boxBodyDef.type = b2Body.b2_dynamicBody;
    var boxBody = this.world.CreateBody(boxBodyDef);
    boxBody.CreateFixture(fixDef);
    return boxBody;
  }
})();

