function searchForIdInArray(id, array) {
	for (var i=0; i < array.length; i++) {
		if (array[i].id == id) {
			return i;
		}
	}
	return false;
}

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

if (hostname) {
	var socket = io.connect('http://' + hostname);
}

var players = [];

var hand = [];

var selectedCard = null;

// Button to start game
$('#start-game').live('click touchend', function(e) {
	socket.emit('startGame', { room: roomId });
	$(this).hide();
});

// Select a card
$('#hand .card').live('click touchend', function(e) {
	$('#hand .card').removeClass('selected');
	$(this).addClass('selected');
});

// Play a card
$('#playCard').live('click touchend', function(e) {
	var cardId = $('#hand .card.selected').attr('card');

	var handIndex = searchForIdInArray(cardId, hand);
	var card = hand[handIndex];
	var legal = true;
	
	if (card.value === 5 || card.value === 6) {
		for (var i=0; i < hand.length; i++) {
			if (hand[i].value === 7) {
				legal = false;
			}
		}
	}
	
	if (card && legal) {
		$('#hand .card.selected').remove();
		hand.splice(handIndex, 1);
		socket.emit('playCard', { card: card, room: roomId, player: playerId });
	} else {
		var notification = '<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button>';
		notification += '<p>You must discard your Countess.</p></div>';	
		$('#alerts').html(notification);	
	}
});

// Events to guess a card
$('#guess-card-modal .player-selection .btn-player').live('click touchend', function(e) {
	$('#guess-card-modal .player-selection .btn-player').removeClass('btn-info');
	$(this).addClass('btn-info');
});

$('#guess-card-modal .card-selection .btn-card').live('click touchend', function(e) {
	$('#guess-card-modal .card-selection .btn-card').removeClass('btn-info');
	$(this).addClass('btn-info');
});

$('#guess-card-modal .btn-primary').live('click touchend', function(e) {
	var selectedPlayer = $('#guess-card-modal .player-selection .btn-info').attr('data-player-id');
	var selectedCard = $('#guess-card-modal .card-selection .btn-info').attr('data-card-id');
	
	if (selectedPlayer && selectedCard) {
		socket.emit('guardAction', { room: roomId, player: playerId, selectedPlayer: selectedPlayer, selectedCard: selectedCard });
	}
	
	$('#guess-card-modal').modal('hide');
});

// Events to select a player
$('#player-selection-modal .player-selection .btn-player').live('click touchend', function(e) {
	$('#player-selection-modal .player-selection .btn-player').removeClass('btn-info');
	$(this).addClass('btn-info');
});

$('#player-selection-modal .btn-primary').live('click touchend', function(e) {
	var selectedPlayer = $('#player-selection-modal .player-selection .btn-info').attr('data-player-id');
	
	var action = $('#player-selection-modal').attr('data-action');
	
	if (selectedPlayer) {
		socket.emit(action, { room: roomId, player: playerId, selectedPlayer: selectedPlayer});
	}
	
	if (action !== 'priestAction') {
		$('#player-selection-modal').modal('hide');
	}
	else {
		$('#player-selection-modal .btn-primary').hide();
	}
});

function startTurn(player){
	$('.player').removeClass('selected');
	$('#player-' + player.id).addClass('selected');
	
	if (playerId == player.id) {
		$('#hand-controls').show();
		socket.emit('drawCard', { room: roomId, player: playerId });
	} else {
		$('#hand-controls').hide();
	}
}

function getCardDisplay(card) {
	var display = '<div class="well span8">'
	display += '<h4>' + card.value + '- ' + card.title + '</h4>';
	display += '<p>' + card.text + '</p>';
	display += '</div>';
	
	return display;
}

function playCard(card) {
	var cardDisplay = getCardDisplay(card);
	$('#table').html(cardDisplay);
}

function addPlayer(player) {
	if (player) {
		players.push(player);
		var display = '<div id="player-' + player.id + '" class="player well span8';
		if (player.turn === true) {
			display += ' selected';
			
			if (player.id == playerId) {
				$('#hand-controls').show();
			}
		}
		display += '">';
		display += '<span class="lead">' 
		if (player.protection) {
			display += '<i class="icon icon-lock"></i> ';
		}
		display += player.name + '</span>';
		display += '<span class="badge pull-right">' + player.score + '</span>';
		display += '</div>';
		$('#players').append(display);
	}
}

function drawCard(card) {
	// Add card to hand
	hand.push(card);
	
	var display = '<div card="' + card.id + '" class="card well span3">'
	display += '<h4>' + card.title + '<span class="pull-right">' + card.value + '</span></h4>';
	display += '<p>' + card.text + '</p>';
	display += '</div>';
	$('#hand').append(display);
}

socket.on('connect', function () {
	if (roomId) {
      socket.emit('join', { room: roomId, player: playerId });
	}
});
 
socket.on('deal', function (data) {
	if (data.card) {
		drawCard(data.card);
	}
});

socket.on('playerPlayed', function (data) {
	playCard(data.card);
});

socket.on('updateScore', function (data) {
	$('#player-' + data.player + ' .badge').html(data.score);
});

socket.on('clearPlayers', function (data) {
	players = [];
	$('#players').html('');
});

socket.on('clearTable', function (data) {
	$('#table').html('');
});

socket.on('clearHand', function (data) {
	$('#hand').html('');
});

socket.on('addPlayer', function (data) {
	addPlayer(data.player);
});

socket.on('updatePlayers', function (data) {
	players = [];
	$('#players').html('');
	
	for (var i=0; i < data.players.length; i++) {
		addPlayer(data.players[i]);
	}
});

socket.on('updateCardCounts', function (data) {
	var counts = '';
	for (x in data.cardCounts) {
	  counts = counts + '<p>' + x + ' <span class="badge pull-right">' + data.cardCounts[x] + '</span></p>';
	}
	$('#played-cards').html(counts);
});

socket.on('updateLog', function (data) {
	$('#game-log').html(data.log);
	$("#game-log").scrollTop($("#game-log")[0].scrollHeight);
});

socket.on('gameStarted', function (data) {
	startTurn(data.player);
});

socket.on('endGame', function (data) {
	$('#hand').html('');
	$('#table').html('');
	
	var notification = '<div class="alert alert-success"><button type="button" class="close" data-dismiss="alert">&times;</button>';
	notification += '<p>' + data.player.name + ' wins!</p></div>';	
	$('#alerts').html(notification);
	
	$('#start-game').show();
});

socket.on('startTurn', function (data) {
	startTurn(data.player);
});

socket.on('nextRound', function (data) {
	$('#round-num').html(data.round);
	$('#table').html('');
});

socket.on('removePlayer', function (data) {
	$('#player-' + data.player ).fadeOut();
	var notification = '<div class="alert"><button type="button" class="close" data-dismiss="alert">&times;</button>';
	notification += '<p>' + data.name + ' was eliminated.</p></div>';
	if (playerId === data.player) {
		$('#hand').html('');
	}
	$('#alerts').html(notification);
	
	var playerIndex = searchForIdInArray(data.player, players);
	players.splice(playerIndex, 1);
});

// Card actions
socket.on('getGuardAction', function (data) {
	$('#guess-card-modal').modal('show');
	
	var content = '';
	for (var i=0; i < players.length; i++) {
		if (players[i].id != playerId) {
			content += '<a class="btn btn-player" ';
			content += 'data-player-id="' + players[i].id + '">' 
			content += players[i].name + '</a>';
		}
	}
	
	$('#guess-card-modal .player-selection').html(content);
	
	content = '';
	for (var key in cards) {
		content += '<a class="btn btn-card" ';
		content += 'data-card-id="' + cards[key].title + '">' 
		content += cards[key].title + '</a>';
	}
	
	$('#guess-card-modal .card-selection').html(content);
});

socket.on('getPriestAction', function (data) {
	$('#player-selection-modal').modal('show');
	$('#player-selection-modal').attr('data-action', 'priestAction');
	
	var content = '';
	for (var i=0; i < players.length; i++) {
		if (players[i].id != playerId) {
			content += '<a class="btn btn-player" ';
			content += 'data-player-id="' + players[i].id + '">' 
			content += players[i].name + '</a>';
		}
	}
	
	$('#player-selection-modal .player-selection').html(content);
	$('#player-selection-modal .btn-primary').show();
});

socket.on('showCard', function (data) {
	if (data.card !== false) {
		var cardDisplay = getCardDisplay(data.card);
	} else {
		cardDisplay = '<p class="lead">The player is protected, you cannot see their card.</p>';
	}
	$('#player-selection-modal .player-selection').html(cardDisplay);
});

socket.on('getBaronAction', function (data) {
	$('#player-selection-modal').modal('show');
	$('#player-selection-modal').attr('data-action', 'baronAction');
	
	var content = '';
	for (var i=0; i < players.length; i++) {
		if (players[i].id != playerId) {
			content += '<a class="btn btn-player" ';
			content += 'data-player-id="' + players[i].id + '">' 
			content += players[i].name + '</a>';
		}
	}
	
	$('#player-selection-modal .player-selection').html(content);
	$('#player-selection-modal .btn-primary').show();
});

socket.on('getPrinceAction', function (data) {
	$('#player-selection-modal').modal('show');
	$('#player-selection-modal').attr('data-action', 'princeAction');
	
	var content = '';
	for (var i=0; i < players.length; i++) {
		if (players[i].id != playerId) {
			content += '<a class="btn btn-player" ';
			content += 'data-player-id="' + players[i].id + '">' 
			content += players[i].name + '</a>';
		}
	}
	
	$('#player-selection-modal .player-selection').html(content);
	$('#player-selection-modal .btn-primary').show();
});

socket.on('getKingAction', function (data) {
	$('#player-selection-modal').modal('show');
	$('#player-selection-modal').attr('data-action', 'kingAction');
	
	var content = '';
	for (var i=0; i < players.length; i++) {
		if (players[i].id != playerId) {
			content += '<a class="btn btn-player" ';
			content += 'data-player-id="' + players[i].id + '">' 
			content += players[i].name + '</a>';
		}
	}
	
	$('#player-selection-modal .player-selection').html(content);
	$('#player-selection-modal .btn-primary').show();
});

socket.on('protectPlayer', function (data) {
	$('#player-' + data.player + ' .lead').prepend('<i class="icon icon-lock"></i> ');
});

socket.on('unprotectPlayer', function (data) {
	$('#player-' + data.player + ' .icon-lock').remove();
});
