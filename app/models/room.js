function searchForIdInArray(id, array) {
	for (var i=0; i < array.length; i++) {
		if (array[i].id === id) {
			return i;
		}
	}
	return false;
}

var Room = function () {

  this.defineProperties({
    name: {type: 'string', required: true},
    players: {type: 'array'},
    waiting: {type: 'array'},
    deck: {type: 'array' },
    table: {type: 'array'},
    turn: {type: 'int'},
    round: {type: 'int'},
    creator: {type: 'string'},
    started: {type: 'boolean'},
    gameLog: {type: 'string'},
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
		
		// Discard unused card(s)
		deck.pop();
		
		if (this.players.length === 2) {
			deck.pop();
			deck.pop();
			deck.pop();
		}
		
		this.deck = deck;
		this.gameLog = '';
		this.table = [];
		this.players = [];
		this.waiting = [];
		this.started = false;
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
		
		// Loop through players, check if highest, and empty hands
		for (var i=1; i < this.players.length; i++) {
			if (this.players[i].hand[0].value > topValue) {
				topPlayer = i;
			} else if (this.players[i].hand[0].value === topValue) {
				if (this.players[i].discarded > this.players[topPlayer].discarded) {
					topPlayer = i;
				}
			}
			this.players[i].hand = [];
		}
		
		// Give score to top player
		this.players[topPlayer].score += 1;
		
		geddy.io.sockets.in(this.id).emit('updateScore', { 
			player: this.players[topPlayer].id,
			score: this.players[topPlayer].score
		});
		
		this.log(this.players[topPlayer].name + ' won this round.');
		
		// Set turn to round winner
		this.turn = topPlayer;
		
		// Move eliminated players back into game
  		while((player=this.waiting.pop()) != null){
  			player.hand = [];
  			this.players.push(player);
	    }
		
		geddy.io.sockets.in(this.id).emit('clearHand', { });
		geddy.io.sockets.in(this.id).emit('clearTable', { });
		
		for (var i=0; i < this.players.length; i++) {
			this.players[i].turn = false;
			card = this.deck.pop();
	  		this.players[i].hand.push(card);
	  		geddy.io.sockets.in(this.players[i].id).emit('deal', { card: card });
  		}
		
		this.players[topPlayer].turn = true;
		
		geddy.io.sockets.in(this.id).emit('updatePlayers', { players: this.players });
		
		if (this.players.length === 2 && this.players[topPlayer].score === 7) {
			this.endGame(topPlayer);
		} else if (this.players.length === 3 && this.players[topPlayer].score === 5) {
			this.endGame(topPlayer);
		} else if (this.players.length === 4 && this.players[topPlayer].score === 7) {
			this.endGame(topPlayer);
		} else {
			geddy.io.sockets.in(this.id).emit('startTurn', { room: data.room, player: this.players[topPlayer] });
		}	
	}
	
	this.activateAbility = function(card, player, socket){
		if (card.title === 'Guard') {
			socket.emit('getGuardAction', {card: card, player: player});
		} else if (card.title === 'Priest') {
			socket.emit('getPriestAction', {card: card, player: player});
		} else if (card.title === 'Baron') {
			socket.emit('getBaronAction', {card: card, player: player});
		} else if (card.title === 'Handmaid') {
			// Find the player and add it to their hand
			var playerIndex = searchForIdInArray(player, this.players);
			this.players[playerIndex].protection = true;
			geddy.io.sockets.in(this.id).emit('protectPlayer', { player: player });
			this.save();
			this.log(this.players[playerIndex].name + ' played a handmaid and is now protected.');
			this.nextTurn();
		} else if (card.title === 'Prince') {
			socket.emit('getPrinceAction', {card: card, player: player});
		} else if (card.title === 'King') {
			socket.emit('getKingAction', {card: card, player: player});
		} else if (card.title === 'Princess') {
			this.removePlayer(player);
			var playerIndex = searchForIdInArray(player, this.players);
		  	this.log(this.players[playerIndex].name + ' played the Princess.');
		} else {
			var playerIndex = searchForIdInArray(player, this.players);
			this.log(this.players[playerIndex].name + ' played the Countess.');
			this.nextTurn();
		}
	}
	
	this.removePlayer = function(player){
		for (var i=0; i < this.players.length; i++) {
			if (this.players[i].id === player) {
				var removedPlayer = this.players.splice(i, 1);
				this.waiting.push(removedPlayer[0]);
				this.log(removedPlayer[0].name + ' was eliminated.');
				geddy.io.sockets.in(this.id).emit('removePlayer', { player: removedPlayer[0].id, name: removedPlayer[0].name });
			}
		}
				
		this.save();
		
		if (this.players.length <= 1) {
			this.finishRound();	
			this.save();
		} else {
			this.nextTurn();
		}
	}
	
	this.nextTurn = function() {
		var playerCount = this.players.length - 1;
		
		if (playerCount > 0) {
		    // If turn is 0 / uninitialized
		    if (!this.turn) {
		    	this.turn = 1;
		    	this.players[0].turn = false;
		    // If it is the last player, set to first
		    } else if (this.turn === playerCount) {
		    	this.turn = 0;
		    	this.players[playerCount].turn = false;
		    // Otherwise just move to the next player
		    } else {
		    	this.players[this.turn].turn = false;
			    this.turn += 1;
		    }
		    
		    this.players[this.turn].turn = true;
		    
		    if (this.players[this.turn].protection) {
			    this.players[this.turn].protection = false;
			    geddy.io.sockets.in(this.id).emit('unprotectPlayer', { player: this.players[this.turn].id });
		    }
		    
		    // Save the room
			this.save();
		
			geddy.io.sockets.in(this.id).emit('startTurn', { room: this.id, player: this.players[this.turn] });
		}
	}
	
	this.drawCard = function(playerId) {
		// if there are cards left
  		if (this.deck.length > 0) {
  			// Take the top card
			var card = this.deck.pop();
			
			// Find the player and add it to their hand
			var playerIndex = searchForIdInArray(playerId, this.players);
			
			this.players[playerIndex].hand.push(card);
			
			// Save the updated room
			this.save(function (err, data) {
				if (err) {
					console.log(err);
				} else {
					geddy.io.sockets.in(playerId).emit('deal', { card: card });
				}
			});
		// If there are no card left, end the round
		} else {
			this.finishRound();
			this.save(function (err, data) {
				if (err) {
					console.log(err);
				} else {
					geddy.io.sockets.in(this.id).emit('nextRound', { room: this.id, round: this.round });
				}
			});
		}
	}
	
	this.startGame = function() {
		this.log('Game started.');
	
	  	// Deal each player a card
		for (var i=0; i < this.players.length; i++) {
			var card = this.deck.pop();
	  		this.players[i].hand.push(card);
	  		geddy.io.sockets.in(this.players[i].id).emit('deal', { card: card });
		}
		
		// Set turn to player 1
		this.players[0].turn = true;
		this.started = true;
		
		var firstPlayer = this.players[0];
		var roomId = this.id;
		
		this.save(function (err, data) {
			if (err) {
				console.log(err);
			} else {
				geddy.io.sockets.in(roomId).emit('gameStarted', { room: roomId, player: firstPlayer });
			}
		});
	}
	
	this.endGame = function(topPlayer) {
		for (var i=0; i < this.players.length; i++) {
			this.players[i].hand = [];
			this.players[i].turn = false;
			this.players[i].score = 0;
		}
		this.started = false;
		
		this.save();
		
		this.log('Game ended.' + this.players[topPlayer] + ' wins.');
		geddy.io.sockets.in(this.id).emit('endGame', { player: this.players[topPlayer] });
	}
	
	this.log = function(message) {
		this.gameLog += '<p>' + message + '</p>';
		geddy.io.sockets.in(this.id).emit('updateLog', { log: this.gameLog });
		this.save();
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

