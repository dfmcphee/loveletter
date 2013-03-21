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

var socket = io.connect('http://localhost');

var players = [];

$('#hand .card').live('click', function(e) {
	$('#hand .card').removeClass('selected');
	$(this).addClass('selected');
});

$('#player-selection .btn-player').live('click', function(e) {
	$('#player-selection .btn-player').removeClass('btn-info');
	$(this).addClass('btn-info');
});

$('#card-selection .btn-card').live('click', function(e) {
	$('#card-selection .btn-card').removeClass('btn-info');
	$(this).addClass('btn-info');
});

$('#player-selection-modal .btn-primary').live('click', function(e) {
	var selectedPlayer = $('#player-selection .btn-info').attr('data-player-id');
	var selectedCard = $('#card-selection .btn-info').attr('data-card-id');
	
	if (selectedPlayer && selectedCard) {
		socket.emit('guardAction', { room: roomId, player: playerId, selectedPlayer: selectedPlayer, selectedCard: selectedCard });
	}
	
	$('#player-selection-modal').modal('hide');
});

$('#playCard').live('click', function(e) {
	var cardIndex = $('#hand .card.selected').attr('card');
	$('#hand .card.selected').remove();
	var handIndex = searchForIdInArray(cardIndex, hand);
	var card = hand[handIndex];
	hand.splice(handIndex, 1);
	socket.emit('playCard', { card: card, room: roomId, player: playerId });
});

$('#drawCard').live('click', function(e) {
	socket.emit('drawCard', { room: roomId, player: playerId });
});

var hand = [];

var selectedCard = null;


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

function playCard(card) {
	var display = '<div class="card well span8">'
	display += '<h3>' + card.value + '- ' + card.title + '</h3>';
	display += '<p class="lead">' + card.text + '</p>';
	display += '</div>';
	$('#table').html(display);
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
		display += '<h3>' + player.name + '- Score: ' + player.score + '</h3>';
		display += '</div>';
		$('#players').append(display);
	}
}

function drawCard(card) {
	// Add card to hand
	hand.push(card);
	
	var display = '<div card="' + card.id + '" class="card well span8">'
	display += '<h3>' + card.value + '- ' + card.title + '</h3>';
	display += '<p class="lead">' + card.text + '</p>';
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
	startTurn(data.player);
});

socket.on('clearPlayers', function (data) {
	players = [];
	$('#players').html('');
});

socket.on('clearHand', function (data) {
	$('#hand').html('');
});

socket.on('addPlayer', function (data) {
	addPlayer(data.player);
});

socket.on('startGame', function (data) {
	startTurn(data.player);
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
	$('#player-eliminated-modal').modal('show');
	$('#player-eliminated-modal .player-name').html(data.name);
});

socket.on('getGuardAction', function (data) {
	$('#player-selection-modal').modal('show');
	
	var content = '';
	for (var i=0; i < players.length; i++) {
		if (players[i].id != playerId) {
			content += '<a class="btn btn-player" ';
			content += 'data-player-id="' + players[i].id + '">' 
			content += players[i].name + '</a>';
		}
	}
	$('#player-selection').html(content);
	
	content = '';
	for (var key in cards) {
		content += '<a class="btn btn-card" ';
		content += 'data-card-id="' + cards[key].title + '">' 
		content += cards[key].title + '</a>';
	}
	$('#card-selection').html(content);
	
});