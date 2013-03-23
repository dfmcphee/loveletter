var Rooms = function () {
  this.respondsWith = ['html', 'json', 'xml', 'js', 'txt'];

  this.index = function (req, resp, params) {
    var self = this;

    geddy.model.Room.all(function(err, rooms) {
      self.respond({params: params, rooms: rooms});
    });
  };

  this.add = function (req, resp, params) {
  	var user = this.session.get('user');
  	if (user) {
    	this.respond({params: params});
    }
    else {
        this.redirect({controller: 'players', action: 'add'});
	}
  };

  this.create = function (req, resp, params) {
  	user = this.session.get('user');
  	
  	if (user) {
	    params.id = params.id || geddy.string.uuid(10);
	
	    var self = this
	      , room = geddy.model.Room.create(params);
	      
	    room.initialize();
	    
	    room.creator = user;
	
	    room.save(function(err, data) {
	      if (err) {
	        params.errors = err;
	        self.transfer('add');
	      } else {
	        self.redirect({controller: self.name});
	      }
	    });  	
  	}
  };

  this.show = function (req, resp, params) {
    var self = this;
    var user = self.session.get('user');
        
    if (user) {
	    geddy.model.Room.first(params.id, function(err, room) {
	     if (typeof(room) !== undefined) {
	      	self.respond({params: params, room: room.toObj(), player: user});
	      } else {
		    self.redirect({controller: self.name});
	      }
	    });
    } else {
	    this.redirect({controller: 'players', action: 'add'});
    }
  };

  this.edit = function (req, resp, params) {
    var self = this;

    geddy.model.Room.first(params.id, function(err, room) {
      self.respond({params: params, room: room});
    });
  };

  this.update = function (req, resp, params) {
    var self = this;

    geddy.model.Room.first(params.id, function(err, room) {
      room.updateAttributes(params);

      room.save(function(err, data) {
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

    geddy.model.Room.remove(params.id, function(err) {
      if (err) {
        params.errors = err;
        self.transfer('edit');
      } else {
        self.redirect({controller: self.name});
      }
    });
  };

};

exports.Rooms = Rooms;
