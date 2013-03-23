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
  		geddy.io.sockets.in(room.id).emit('updateLog', { log: room.gameLog });
  		
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
	  	if (playerIndex === false && room.players.length < 4) {
	  		// Find the player
		  	geddy.model.Player.first(data.player, function(err, player) {
		  		// Initialize it for room
		  		player.score = 0;
		  		player.discarded = 0;
		  		player.protection = false;
		  		player.hand = [];
		  		player.turn = false;
		  		
		  		// Add it to room players
			  	room.players.push(player);
			  	
			  	// Broadcast new player to all members of room
			  	geddy.io.sockets.in(room.id).emit('addPlayer', {player: player});
			  	
			  	// Save the room and start the game
			  	room.save(function (err, data) {
					if (err) {
						console.log(err);
					} else {
						socket.emit('addPlayer', { player: room.players[room.players.length] });
					}
				});
			});
	  	}
  	});
  });
  
  // Event when someone draws a card
  socket.on('drawCard', function (data) {
  	// Load the room the card is drawn from
  	geddy.model.Room.first(data.room, function(err, room) {
	  	room.drawCard(data.player);
  	});
  });
  
  // Event to start game
  socket.on('startGame', function (data) {
	geddy.model.Room.first(data.room, function(err, room) {
	  	room.startGame();
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
	  	
	  	// Add value to players discarded
	  	room.players[playerIndex].discarded += card.value;
	  	
	  	// Add it to the table
	    room.table.push(card);
	    
	    // and activate its ability
	    room.activateAbility(card, data.player, socket);
	    
	    room.save();
		
		geddy.io.sockets.in(data.room).emit('playerPlayed', { card: data.card, player: room.players[room.turn] });
    });
  });
  
  // Event when a player completes a guard action
  socket.on('guardAction', function (data) {
  	geddy.model.Room.first(data.room, function(err, room) {
  		// Check if player is in game
  		var playerOne = searchForIdInArray(data.player, room.players);
	  	var playerIndex = searchForIdInArray(data.selectedPlayer, room.players);

	  	if (playerIndex !== false && room.players[playerIndex].protection === false) {
	  	
	  		// Check if card is in players hand
	  		var cardIndex = false;
	  		for (var i=0; i < room.players[playerIndex].hand.length; i++) {
				if (room.players[playerIndex].hand[i].title === data.selectedCard) {
					cardIndex = true;
				}
			}
	  		
	  		room.log(room.players[playerOne].name + ' played a Guard and guessed ' + room.players[playerIndex].name + ' has a ' + data.selectedCard + '.');
	  		
	  		if (cardIndex) {
	  			console.log('Correct guess!');
		  		room.removePlayer(data.selectedPlayer);
	  		} else {
		  		room.nextTurn();
	  		}
	  	} else {
	  		room.log(room.players[playerOne].name + ' played a Guard and guessed ' + room.players[playerIndex].name + ' has a ' + data.selectedCard + ' but player is protected.');
		  	room.nextTurn();
	  	}
  	});
  });
  
  // Event when a player completes priest action 
  socket.on('priestAction', function (data) {
  	geddy.model.Room.first(data.room, function(err, room) {
  		// Check if player is in game and not protected
	  	var playerOne = searchForIdInArray(data.player, room.players);
	  	var playerIndex = searchForIdInArray(data.selectedPlayer, room.players);
	  	
	  	if (playerIndex !== false && room.players[playerIndex].protection === false) {
	  		var card = room.players[playerIndex].hand[0];
	  		room.log(room.players[playerOne].name + ' played a Priest and looked at ' + room.players[playerIndex].name + '\'s hand.');
	  	} else {
	  		room.log(room.players[playerOne].name + ' played a Priest but ' + room.players[playerIndex].name + ' is protected.');
		  	card = false;
	  	}
	  	
	  	socket.emit('showCard', {card: card});
	  	room.nextTurn();
  	});
  });
  
  // Event when a player completes baron action
  socket.on('baronAction', function (data) {
  	geddy.model.Room.first(data.room, function(err, room) {
  		var playerOne = searchForIdInArray(data.player, room.players);
	  	var playerTwo = searchForIdInArray(data.selectedPlayer, room.players);

	  	// If both players were found in room
	  	if (playerOne !== false && playerTwo !== false) {
	  		if (room.players[playerTwo].protection === false) {
		  		var cardOne = room.players[playerOne].hand[0];
		  		var cardTwo = room.players[playerTwo].hand[0];
		  		
		  		room.log(room.players[playerOne].name + ' played a Baron and compared hands with ' + room.players[playerTwo].name + '.');
		  		
		  		// Compare card values, remove the loser
		  		if (cardTwo.value > cardOne.value) {
			  		room.removePlayer(data.player, data.room);
		  		} else if (cardOne.value > cardTwo.value) {
			  		room.removePlayer(data.selectedPlayer, data.room);
		  		} else {
			  		// or just skip to the next turn
			  		room.log('Cards tie, neither discards.');
			  		room.nextTurn();
		  		}
	  		} else {
		  		room.log(room.players[playerOne].name + ' played a Baron but ' + room.players[playerTwo].name + ' is protected.');
		  		room.nextTurn();
	  		}
	  	}
  	});
  });
  
  // Event when a player completes prince action
  socket.on('princeAction', function (data) {
  	geddy.model.Room.first(data.room, function(err, room) {
  		var playerOne = searchForIdInArray(data.player, room.players);
	  	var playerIndex = searchForIdInArray(data.selectedPlayer, room.players);
	  	var eliminated = false;
	  	
	  	// Check if player is in game
	  	if (playerIndex !== false && room.players[playerIndex].protection === false) {
	  		geddy.io.sockets.in(data.selectedPlayer).emit('clearHand', { });
	  		if (room.players[playerIndex].hand[0].value === 8) {
	  			eliminated = true;
		  		room.removePlayer(data.selectedPlayer, data.room);
	  		} else {
		  		room.players[playerIndex].hand = [];
		  		room.drawCard(data.selectedPlayer);
		  		room.log(room.players[playerOne].name + ' played a Prince and made ' + room.players[playerIndex].name + ' discard his/her hand.');
	  		}
	  	} else {
		  	room.log(room.players[playerOne].name + ' played a Prince but ' + room.players[playerIndex].name + ' is protected.');
	  	}
	  	
	  	if (!eliminated) {
	  		room.nextTurn();
	  	}
  	});
  });
  
  // Event when a player completes prince action
  socket.on('kingAction', function (data) {
  	geddy.model.Room.first(data.room, function(err, room) {
  		// Check if player is in game
  		var playerOne = searchForIdInArray(data.player, room.players);
	  	var playerTwo = searchForIdInArray(data.selectedPlayer, room.players);

	  	if (playerOne !== false && playerTwo !== false) {
	  		if (room.players[playerTwo].protection === false) {
		  		var cardOne = room.players[playerOne].hand.pop();
		  		var cardTwo = room.players[playerTwo].hand.pop();
		  		
		  		room.players[playerOne].hand.push(cardTwo);
		  		room.players[playerTwo].hand.push(cardOne);
		  		
		  		geddy.io.sockets.in(data.player).emit('clearHand', { });
		  		geddy.io.sockets.in(data.player).emit('deal', { card: cardTwo });
		  		
		  		geddy.io.sockets.in(data.selectedPlayer).emit('clearHand', { });
		  		geddy.io.sockets.in(data.selectedPlayer).emit('deal', { card: cardOne });
		  		
		  		room.log(room.players[playerOne].name + ' played a King and swapped hands with ' + room.players[playerTwo].name + '.');
	  		}
	  		else {
			  	room.log(room.players[playerOne].name + ' played a King but ' + room.players[playerTwo].name + ' is protected.');
		  	}
	  	}
	  	room.nextTurn();
  	});
  });
  
  // Event when someone leaves the room
  socket.on('disconnect', function () {
  	console.log('User disconnected.');
  });
});