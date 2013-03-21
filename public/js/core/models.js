(function () {
var Player = function () {

  this.defineProperties({
  	name: {type: 'string', required: true},
    hand: {type: 'array'},
    score: {type: 'int'},
    turn: {type: 'boolean'},
  });

  /*
  this.property('login', 'string', {required: true});
  this.property('password', 'string', {required: true});
  this.property('lastName', 'string');
  this.property('firstName', 'string');

  this.validatesPresent('login');
  this.validatesFormat('login', /[a-z]+/, {message: 'Subdivisions!'});
  this.validatesLength('login', {min: 3});
  // Use with the name of the other parameter to compare with
  this.validatesConfirmed('password', 'confirmPassword');
  // Use with any function that returns a Boolean
  this.validatesWithFunction('password', function (s) {
      return s.length > 0;
  });

  // Can define methods for instances like this
  this.someMethod = function () {
    // Do some stuff
  };
  */

};

/*
// Can also define them on the prototype
Player.prototype.someOtherMethod = function () {
  // Do some other stuff
};
// Can also define static methods and properties
Player.someStaticMethod = function () {
  // Do some other stuff
};
Player.someStaticProperty = 'YYZ';
*/

Player = geddy.model.register('Player', Player);

}());

(function () {
var Room = function () {

  this.defineProperties({
    name: {type: 'string', required: true},
    players: {type: 'array'},
    waiting: {type: 'array'},
    deck: {type: 'array' },
    table: {type: 'array'},
    turn: {type: 'int'},
    round: {type: 'int'},
  });

  /*
  this.property('login', 'string', {required: true});
  this.property('password', 'string', {required: true});
  this.property('lastName', 'string');
  this.property('firstName', 'string');

  this.validatesPresent('login');
  this.validatesFormat('login', /[a-z]+/, {message: 'Subdivisions!'});
  this.validatesLength('login', {min: 3});
  // Use with the name of the other parameter to compare with
  this.validatesConfirmed('password', 'confirmPassword');
  // Use with any function that returns a Boolean
  this.validatesWithFunction('password', function (s) {
      return s.length > 0;
  });

  // Can define methods for instances like this
  this.someMethod = function () {
    // Do some stuff
  };
  */
  
  // Initialize card types
  cards = {
	guard: {
		value: 1,
		title: "Guard",
		text: "Name a non-Guard player. If that player has that card, he or she is out of the round."
	},
	priest: {
		value: 2,
		title: "Priest",
		text: "Look at another player's hand"
	},
	baron: {
		value: 3,
		title: "Baron",
		text: "You and another player secretly compare hands. The player with the lower value is out of the round."
	},
	handmaid: {
		value: 4,
		title: "Handmaid",
		text: "Until your next turn, ignore all effects from other player's cards."
	},
	prince: {
		value: 5,
		title: "Prince",
		text: "Choose any player (including yourself) to discard his or her hand and draw a new card."
	},
	king: {
		value: 6,
		title: "King",
		text: "Trade hands with another player of your choice."
	},
	countess: {
		value: 7,
		title: "Countess",
		text: "If you have this card and the King or Prince in your hand, you must discard this card."
	},
	princess: {
		value: 8,
		title: "Princess",
		text: "If you discard this card, you are out of the round."
	}
  };
  
  // Creates deck by adding correct ammount of each card
  this.initialize = function(){
		deck = [];
		cardId = 0;
		
		for (var i=0; i < 5; i++) {
			deck.push(cards.guard);
			deck[deck.length-1].id = cardId++;
		}
		
		for (i=0; i < 2; i++) {
			deck.push(cards.priest);
			deck[deck.length-1].id = cardId++;
		}
		
		for (i=0; i < 2; i++) {
			deck.push(cards.baron);
			deck[deck.length-1].id = cardId++;
		}
		
		for (i=0; i < 2; i++) {
			deck.push(cards.handmaid);
			deck[deck.length-1].id = cardId++;
		}
		
		for (i=0; i < 2; i++) {
			deck.push(cards.prince);
			deck[deck.length-1].id = cardId++;
		}
		
		deck.push(cards.king);
		deck[deck.length-1].id = cardId++;
		
		deck.push(cards.countess);
		deck[deck.length-1].id = cardId++;
		
		deck.push(cards.princess);
		deck[deck.length-1].id = cardId++;
		
		for(var j, x, i = deck.length; i; j = parseInt(Math.random() * i), x = deck[--i], deck[i] = deck[j], deck[j] = x);
		
		// Discard unused card
		deck.pop();
		
		this.deck = deck;
		this.table = [];
		this.players = [];
		this.waiting = [];
		this.round = 1;
	}
	
	 this.finishRound = function(){
	 	deck = [];
		cardId = 0;
		
		for (var i=0; i < 5; i++) {
			deck.push(cards.guard);
			deck[deck.length-1].id = cardId++;
		}
		
		for (i=0; i < 2; i++) {
			deck.push(cards.priest);
			deck[deck.length-1].id = cardId++;
		}
		
		for (i=0; i < 2; i++) {
			deck.push(cards.baron);
			deck[deck.length-1].id = cardId++;
		}
		
		for (i=0; i < 2; i++) {
			deck.push(cards.handmaid);
			deck[deck.length-1].id = cardId++;
		}
		
		for (i=0; i < 2; i++) {
			deck.push(cards.prince);
			deck[deck.length-1].id = cardId++;
		}
		
		deck.push(cards.king);
		deck[deck.length-1].id = cardId++;
		
		deck.push(cards.countess);
		deck[deck.length-1].id = cardId++;
		
		deck.push(cards.princess);
		deck[deck.length-1].id = cardId++;
				
		for(var j, x, i = deck.length; i; j = parseInt(Math.random() * i), x = deck[--i], deck[i] = deck[j], deck[j] = x);
		
		this.deck = deck;
		this.table = [];
		
		var topPlayer = 0;
		var topValue = this.players[0].hand[0].value;
		this.players[0].hand = [];
		
		for (var i=1; i < this.players.length; i++) {
			if (this.players[i].hand[0].value > topValue) {
				topPlayer = i;
			}
			this.players[i].hand = [];
		}
		
		this.players[topPlayer].score += 1;
		this.players[topPlayer].turn = true;
		this.round = topPlayer;
		
		// Move eliminated players back into game
		for (var i=0; i < this.waiting.length; i++) {
			player = this.waiting.pop();
	  		this.players.push(player);
	  		geddy.io.sockets.in(this.id).emit('addPlayer', { player: player });
  		}
		
		geddy.io.sockets.in(this.id).emit('clearHand', { });
		
		for (var i=0; i < this.players.length; i++) {
			card = this.deck.pop();
	  		this.players[i].hand.push(card);
	  		geddy.io.sockets.in(this.players[i].id).emit('deal', { card: card });
  		}
		
		geddy.io.sockets.in(this.id).emit('startTurn', { room: data.room, player: this.players[topPlayer] });
	}
	
	this.activateAbility = function(card, player, socket){
		if (card.title === 'Guard') {
			socket.emit('getGuardAction', {card: card, player: player});
		}
	}
	
	this.removePlayer = function(player, room){
		
		for (var i=0; i < this.players.length; i++) {
			if (this.players[i].id === player) {
				var removedPlayer = this.players.splice(i, 1);
				this.waiting.push(removedPlayer[0]);
				console.log('Player removed');
				geddy.io.sockets.in(room).emit('removePlayer', { player: removedPlayer[0].id, name: removedPlayer[0].name });
			}
		}
		this.save();
		
		if (this.players.length <= 1) {
			this.finishRound();
			this.save();
		}
	}
};

/*
// Can also define them on the prototype
Room.prototype.someOtherMethod = function () {
  // Do some other stuff
};
// Can also define static methods and properties
Room.someStaticMethod = function () {
  // Do some other stuff
};
Room.someStaticProperty = 'YYZ';
*/


Room = geddy.model.register('Room', Room);

}());