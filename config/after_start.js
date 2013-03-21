function searchStringInArray (str, strArray) {
	var arr = strArray;
    for (var j=0; j<strArray.length; j++) {
        if (strArray[j].id.match(str)) {
        	return j;
        }
    }
    return -1;
}

function searchForIdInArray(id, array) {
	for (var i=0; i < array.length; i++) {
		if (array[i].id === id) {
			return i;
		}
	}
	return false;
}

geddy.io.sockets.on('connection', function (socket) {
  // Event when someone plays a card
  socket.on('join', function (data) {
  	socket.join(data.room);
  	socket.join(data.player);
  	
  	geddy.model.Room.first(data.room, function(err, room) {
  		socket.emit('clearPlayers', {});
  		
  		// Fill players list
  		for (var i=0; i < room.players.length; i++) {
	  		socket.emit('addPlayer', {player: room.players[i]});
  		}
  		
  		// Find player in room
  		var playerIndex = searchForIdInArray(data.player, room.players);
		
		// If player is found, restore cards from hand
		if (playerIndex !== false) {
			socket.emit('clearHand', { });
			for (var i=0; i < room.players[playerIndex].hand.length; i++) {
	  			socket.emit('deal', {card: room.players[playerIndex].hand[i]});
	  		}
  		} else {
	  		playerIndex = searchForIdInArray(data.player, room.waiting);
  		}
   		
   		// If player is not yet in room
	  	if (playerIndex === false) {
	  		// Find the player
		  	geddy.model.Player.first(data.player, function(err, player) {
		  		// Initialize it for room
		  		player.score = 0;
		  		player.hand = [];
		  		player.turn = false;
		  		
		  		// Add it to room players
			  	room.players.push(player);
			  	
			  	// Broadcast new player to all members of room
			  	geddy.io.sockets.in(room.id).emit('addPlayer', {player: player});
			  	
			  	var startGame = false;
			  	
			  	// If four players have joined room
			  	if (room.players.length === 4) {
			  		// Deal each player a card
  					for (var i=0; i < room.players.length; i++) {
						card = room.deck.pop();
				  		room.players[i].hand.push(card);
				  		geddy.io.sockets.in(room.players[i].id).emit('deal', { card: card });
			  		}
			  		
			  		// Start turn to player 1
			  		room.players[0].turn = true;
			  		startGame = true;
			  	}
			  	
			  	// Save the room and start the game
			  	room.save(function (err, data) {
					if (err) {
						console.log(err);
					} else {
						socket.emit('addPlayer', { player: room.players[room.players.length] });
						if (startGame) {
						  	geddy.io.sockets.in(room.id).emit('startGame', { room: data.room, player: room.players[0] });
					  	}
					}
				});
			});
	  	}
  	});
  });
  
  // Event when someone plays a card
  socket.on('drawCard', function (data) {
  	// load the room the card is drawn from
  	geddy.model.Room.first(data.room, function(err, room) {
  		// if there are cards left
  		if (room.deck.length > 0) {
  			// Take the top card
			var card = room.deck.pop();
			
			// Find the player and add it to their hand
			var playerIndex = searchForIdInArray(data.player, room.players);
			room.players[playerIndex].hand.push(card);
			
			// Save the updated room
			room.save(function (err, data) {
				if (err) {
					console.log(err);
				} else {
					socket.emit('deal', { card: card });
				}
			});
		// If there are no card left, end the round
		} else {
			room.finishRound();
			room.save(function (err, data) {
				if (err) {
					console.log(err);
				} else {
					geddy.io.sockets.in(room.id).emit('nextRound', { room: data.room, round: room.round });
				}
			});
		}
	});
  });
  
  // Event when someone plays a card
  socket.on('playCard', function (data) {
  	console.log(data);
  	// Get the room
  	geddy.model.Room.first(data.room, function(err, room) {
	  	var playerIndex = searchForIdInArray(data.player, room.players);
	  	// Get card from players hand
	  	var cardIndex = searchForIdInArray(data.card.id, room.players[playerIndex].hand);
	  	
	  	var card = room.players[playerIndex].hand[cardIndex];
	  	
	  	// Remove card from hand
	  	room.players[playerIndex].hand.splice(cardIndex, 1);
	  	
	  	// Add it to the table
	    room.table.push(card);
	    
	    room.activateAbility(card, data.player, socket);
	    
	    var playerCount = room.players.length - 1;
	    
	    // If turn is 0 / uninitialized
	    if (!room.turn) {
	    	room.turn = 1;
	    	room.players[0].turn = false;
	    // If it is the last player, set to first
	    } else if (room.turn === playerCount) {
	    	room.turn = 0;
	    	room.players[playerCount].turn = false;
	    // Otherwise just move to the next player
	    } else {
	    	room.players[room.turn].turn = false;
		    room.turn += 1;
	    }
	    
	    room.players[room.turn].turn = true;
	    
	    // Save the room
		room.save();
		
		geddy.io.sockets.in(data.room).emit('playerPlayed', { card: data.card, player: room.players[room.turn] });
    });
  });
  
  socket.on('guardAction', function (data) {
  	geddy.model.Room.first(data.room, function(err, room) {
  		// Check if player is in game
	  	var playerIndex = searchForIdInArray(data.selectedPlayer, room.players);
	  	console.log('Checking if player is in game...');
	  	if (playerIndex !== false) {
	  		// Check if card is in players hand
	  		console.log('Checking if card is in players hand...');
	  		
	  		var cardIndex = false;
	  		for (var i=0; i < room.players[playerIndex].hand.length; i++) {
				if (room.players[playerIndex].hand[i].title === data.selectedCard) {
					cardIndex = true;
				}
			}
	  		
	  		if (cardIndex) {
	  			console.log('Correct guess!');
		  		room.removePlayer(data.selectedPlayer, data.room);
	  		}
	  	}
	  	
	  	console.log(data);
  	});
  });
  
  // Event when someone leaves the room
  socket.on('disconnect', function () {
  	console.log('User disconnected.');
  });
});