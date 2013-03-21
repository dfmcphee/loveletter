var Players = function () {
  this.respondsWith = ['html', 'json', 'xml', 'js', 'txt'];

  this.index = function (req, resp, params) {
    var self = this;

    geddy.model.Player.all(function(err, players) {
      self.respond({params: params, players: players});
    });
  };

  this.add = function (req, resp, params) {
  	if (this.session.get('user')) {
    	this.redirect({controller: 'rooms'});    
    } else {
    	this.respond({params: params});
    }
  };

  this.create = function (req, resp, params) {
    params.id = params.id || geddy.string.uuid(10);

    var self = this
      , player = geddy.model.Player.create(params);

    if (self.session.get('user')) {
    	self.redirect({controller: 'rooms'});    
    } else {
    	player.hand = [];
    	player.score = 0;
	    player.save(function(err, data) {
	      if (err) {
	        params.errors = err;
	        self.transfer('add');
	      } else {
	      	self.session.set('user', player.id);
	        self.redirect({controller: 'rooms'});
	      }
	    });
    }
  };

  this.show = function (req, resp, params) {
    var self = this;

    geddy.model.Player.first(params.id, function(err, player) {
      self.respond({params: params, player: player.toObj()});
    });
  };

  this.edit = function (req, resp, params) {
    var self = this;

    geddy.model.Player.first(params.id, function(err, player) {
      self.respond({params: params, player: player});
    });
  };

  this.update = function (req, resp, params) {
    var self = this;

    geddy.model.Player.first(params.id, function(err, player) {
      player.updateAttributes(params);

      player.save(function(err, data) {
        if (err) {
          params.errors = err;
          self.transfer('edit');
        } else {
          self.redirect({controller: self.name});
        }
      });
    });
  };

  this.destroy = function (req, resp, params) {
    var self = this;

    geddy.model.Player.remove(params.id, function(err) {
      if (err) {
        params.errors = err;
        self.transfer('edit');
      } else {
        self.redirect({controller: self.name});
      }
    });
  };

};

exports.Players = Players;
