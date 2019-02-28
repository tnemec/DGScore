
//(function($) {

	var constants = {
		maxPlayers : 6,
		strokeLimit : 8,
		serviceEndpoint : 'https://288xd5cild.execute-api.us-west-2.amazonaws.com/beta'
	};

	var flags = {
		savedCoursesLoaded : false
	};

	var savedData = {
		savedPlayers : [
			{name: 'Tony', uid: 100, img: ''},
			{name: 'Steve', uid: 101, img: ''}, 
			{name: 'Andrew', uid: 102, img: ''}, 

			],
		savedCourses : [],
	};

	var tempData = {
		courses: []
	};

	var accountData = {
		'player' : {name: 'Tony', uid: 100, img: '', icon: ''},
		'loggedin' : true
	};

	var data = {
		meta: {
			date: '',
			time: '',
			clientid: 0,
			private: false
		},
		newround: { // temp data while setting up new round
			course: {},
			players: []
		},
		round: {
			totalHoles: 18,
			defaultPar: 3,
			startingHole: 0,
			currentHole: 0,
			started: false,
			ended: false
		},
		course: {},
		courseid: 0,
		players: [],
		scorecard: [
			{'player': 0, 'score': []}
		]
	}


	var dataTemplates = {
		score : {s: 0, p: 0, gh: 0, icp: 0, ocp: 0},
		course : {name: 'Untitled Course', city: '', state: '', zip: '', lat: 0, lon: 0, priv: 0, fee: 0, holes: 18, par: [], defaultPar: 3, dist: [], notes: '', uuid: ''},
		player : {name: 'Player', uid: 0, img: '', icon: ''}
	};

	var uiSelectors = {
		holeNumber: '[data-var="holeNumber"]',
		playerCardContainer: '.player-cards',
		playerCards: '.player-card[data-id]',
		playerCardTemplate: '#playerCardTemplate',
		courseName:  '[data-var="courseName"]',
		holeInfo: '[data-var="holeInfo"]',
		holePage: '#hole-0',
		strokes: '[data-var="strokes"]',
		playerRoundScore: '[data-var="playerRoundScore"]',
		playerRoundPar: '[data-var="playerRoundPar"]',
		playerName: '[data-var="playerName"]',
		playerPicture: '.player-picture"',
		playerList: '[data-var="playerList"]',
		editPlayer: '#edit-player',
		editPlayerName: '#edit-player .player-name',
		editPlayerPicture: '#edit-player .player-picture',
		editPlayerSave: '#edit-player .save',
		editPlayerCancel: '#edit-player .cancel',
		editPlayerRemove: '#edit-player .remove',
		resumeRound: '#resume-round',
		savedPlayerList: '.saved-player-list',
		savedCourseList: '.saved-course-list',
		scoreChart: '.score-chart',
		scorecardReturn: '#scorecardReturn',
		selectedCourse: '.selected-course',
		startRoundBtn: '#startRound_btn',
		scoreChartListHdr: '.score-chart-header',
		scoreChartListItems: '#scoreChartList .row',
		lastRound: '#lastRound',
		lastRoundPLayed: '[data-var="lastRoundPlayed"]',
		modal: '.modal',
		modalHeader: '.modal .header',
		modalContent: '.modal .content',
		viewScore: '#viewScorecard',
		prevHole: '.prevHole',
		nextHole: '.nextHole'
	}


// *** actions *** 
// assigns onClick actions to data-action elements

	var actions = {
		titlePage : function(){
			showPage('title');
		},
		startRound	: function(){
			startRound(); 
		},
		clearNewRound : function() {
			clearNewRound();
		},
		newRound 	: function() {
			if(! readyToStart()) { 
				$(uiSelectors.startRoundBtn).attr('disabled','disabled');
			}
			actions.clearNewRound();
			actions.addPlayerSelf();
			showPage('new-round');
		},
		addSavedPlayer 	: function(id){
			addSavedPlayer(id);
		},
		addPlayerSelf : function() {
			addPlayerSelf();
		},
		newPlayer : function() {
			newPlayer();
		},
		savePlayer : function() {
			savePlayer()
		},
		viewScore	: function(){
			if(data.round.started == false) {
				data = readLocalData();
			}
			showScoreCard();
		},
		scoreCard : function(){
			showScoreCard();
		},
		showSavedPlayers : function(){
			showSavedPlayers();
		},
		getSavedCourses : function(){
			var savedCourses = readLocalData('savedCourses');
			if(savedCourses && savedCourses.length) {
				tempData.courses = savedCourses;
			} else {
				tempData.courses = [];
			}
			showCourses(tempData.courses);
			showPage('recent-courses');
		},
		getNearbyCourses : function(){
			var body = {
				'mode' : 'get',
				'type' : 'course'
			};
			showPage('loading');
			sendRequest(constants.serviceEndpoint, 'POST', body).then(function(response){
				tempData.courses = response.Items;
				showCourses(tempData.courses);
				showPage('nearby-courses');
			}).catch(function(e){
				console.log('Failed service request: ' + e);
			});
			
		},		
		selectThisCourse : function(id){
			selectThisCourse(id);
		},
		resumeRound : function() {
			resumeRound();
		},
		nextHole : function() {
			markAsPlayed();
			viewHole('next');
		},
		prevHole : function() {
			viewHole('prev');
		},
		currentHole : function() {
			gotoCurrentHole();
		},
		title : function() {
			showPage('title');
		},
		endRound : function() {
			endRound(false);
		},
		endRoundConfirm : function() {
			endRound(true);
		},
		closeModal : function() {
			closeModal();
		},
		checkSaved : function() {
			checkSaved();
		},
		getLocation : function() {
			// TODO
			//getLocation();
		}

	};

	var pageActions = {
		// keys are the page ids
		// when showPage is called, the matching actions are executed
		'title' : actions.checkSaved,
		'score-card' : function() {
			if(data.round.ended) {
				$(uiSelectors.scorecardReturn).hide();
			} else {
				$(uiSelectors.scorecardReturn).show();
			}
		},
		'select-course' : actions.getLocation

	};

	var setActions = function(obj){
		if(!obj) obj = $('body');
		var $actionButtons = $('[data-action]', obj);
		var keys = Object.keys(actions);

		$actionButtons.each(function(){
			var action = $(this).attr('data-action');
			if(keys.indexOf(action) != -1) {
				$(this).on('click', function(){
					if($(this).attr('data-id') != undefined) {
						actions[action]($(this).attr('data-id'));
					} else {
						actions[action]();
					}
					
				});
				$(this).addClass('click-'+ action);
				$(this).removeAttr('data-action');
			}
		});
	};

	var addPlayer = function(playerData){
		console.log('addPlayer ');
		var playerCount = data.newround.players.length;
		if(playerCount < constants.maxPlayers) {
			data.newround.players.push(playerData);
			updatePlayerList(true);
			showPage('new-round');
		} else {
			// round full
			$('.click-addPlayer').remove();
		}
		if(readyToStart()) {
			$(uiSelectors.startRoundBtn).removeAttr('disabled');
		}
	};

	var addSavedPlayer = function(id) {
		if(id <= savedData.savedPlayers) {
			addPlayer(savedData.savedPlayers[id]);
		}
	};

	var addPlayerSelf = function() {
		// if account is active, add the accountholder as the first player
		if(accountData.loggedin && accountData.player) {
			var playeradded = false;
			for(var i = 0; i < data.newround.players.length; i++) {
				if(data.newround.players[i].uid == accountData.player.uid) {
					playeradded = true;
					break;
				}
			}
			if(! playeradded) {
				addPlayer(accountData.player);
			}
			updatePlayerList(true);
		}
	};
	var removePlayer = function(id, newround) {
		if(newround) {
			data.newround.players.splice(id,1);
		} else {
			data.players.splice(id,1)
		}
		updatePlayerList(true);
	}

	var newPlayer = function() {
		var newPlayer = clone(dataTemplates.player);
		newPlayer.name = 'Player ' + (data.newround.players.length +1);
		data.newround.players.push(newPlayer);
		updatePlayerList(true);
		editPlayer(data.newround.players.length -1,true,'new-round');
	};

	var showSavedPlayers = function() {
		console.log('showSavedPlayers');
		var $target = $(uiSelectors.savedPlayerList);
		$target.html('').append('<li><a data-action="newPlayer">Create New Player</a></li>');
		for(var i=0; i < savedData.savedPlayers.length; i++){
			var player = savedData.savedPlayers[i];
			$target.append('<li><a data-action="addSavedPlayer" data-id="' + i + '">' + player.name + '</a></li>');
		}
		setActions();
		showPage('select-player');
	};

	var showCourses = function(data) {
		console.log('getCourses');
		var $target = $(uiSelectors.savedCourseList);
		$target.html('');
		$target.append('<li><a data-action="selectThisCourse" data-id="-1">Generic 9 Holes</a></li>');
		$target.append('<li><a data-action="selectThisCourse" data-id="-2">Generic 18 Holes</a></li>');
		for(var i=0; i < data.length; i++){
			var course = data[i];
			$target.append('<li><a data-action="selectThisCourse" data-id="' + i + '">' + course.name + ' - ' + course.holes + ' holes</a></li>');
		}
		setActions();
		
	};

	var selectThisCourse = function(id) {
		if(id == -1) {
			// select generic 9 hole
			data.newround.course = clone(dataTemplates.course);
			data.newround.course.name = 'Untitled 9 Hole Course';
			data.newround.course.holes = 9;
		} else if(id == -2) {
			// select generic 9 hole
			data.newround.course = clone(dataTemplates.course);
			data.newround.course.name = 'Untitled 18 Hole Course';
			data.newround.course.holes = 18;
		} else if(id <= tempData.courses.length){
			// clone the course data to the local data obj
			data.newround.course = clone(tempData.courses[id]);
		} else {
			logError('invalidcourse',id);
		} 
		if(data.newround.course.name) {
			$(uiSelectors.selectedCourse).html(data.newround.course.name);
		}
		if(readyToStart()) {
			$(uiSelectors.startRoundBtn).removeAttr('disabled');
		}
		showPage('new-round');
	}

	var clearNewRound = function() {
		data.newround.players = [];
		data.newround.course =  {};
		$(uiSelectors.playerList).html('');
		//$(uiSelectors.selectedCourse).html('');
	};

	var startRound = function() {
		if(readyToStart()) {
			console.log('start round');
			// lookup course
			data.course = clone(data.newround.course);
			data.round.totalHoles = data.course.holes;
			data.round.defaultPar = data.course.defaultPar;
			// create players
			data.players = [];
			for(var i=0; i < data.newround.players.length; i++){	
				data.players[i] = data.newround.players[i]
				data.players[i].id = i;
			}
			clearNewRound();
			
			// create blank scorecards
			$(uiSelectors.playerCards).remove();
			for(var i =0; i < data.players.length; i++){
				createPlayerCard(i);
			}
			
			// set the starttime
			data.meta.date = getCurrentDate()['date'];
			data.meta.time = getCurrentDate()['time'];

			data.round.started = true;

			// save course to recently played
			storePlayedCourse(data.course);

			// save to local
			storeLocalData('data', data);
			// save players to local storage
			storePlayerList(data.newround.players);


			// jump to starting hole
			console.log('Starting Round')
			viewHole(data.round.startingHole);
		}
	};

	var resumeRound = function() {
		// load saved data
		if(readLocalData('data') && readLocalData('data').round.ended == false) {
			data = readLocalData('data');
			// create blank scorecards
			$(uiSelectors.playerCards).remove();
			for(var i =0; i < data.players.length; i++){
				createPlayerCard(i);
			}
			actions.currentHole();
		} else {
			console.log('cannot resume')
		}
	};


	var endRound = function(confirm) {
		if(confirm) {
			console.log('ending round');
			data.round.ended = true;
			storeLocalData('data');
			// archive round
			closeModal();
			showScoreCard();
		} else {
			var opts = {
				'content' : 'End this round?',
				'buttons' : [
					{'action' : 'closeModal', 'text' : 'Cancel', 'class': 'outline'},
					{'action' : 'endRoundConfirm', 'text' : 'End Round', 'class' : ''}
				]
			}
			openModal(opts);
		}
	};



	var createPlayerCard = function(playerId) {
		data.scorecard[playerId] = {'player': playerId, score: []};
		$page = $(uiSelectors.holePage);
		var $newCard = $(uiSelectors.playerCardTemplate).clone();
		$newCard.attr('data-id', playerId).attr('id','').css('display: block');
		$(uiSelectors.playerName,$page).html(data.players[playerId].name);

		// actions
		$('[data-action="subStroke"]',$newCard).on('click',function(){
			subStroke(playerId);
		});
		$('[data-action="addStroke"]',$newCard).on('click',function(){
			addStroke(playerId);
		});			

		$(uiSelectors.playerCardContainer,$page).append($newCard);
		console.log('Player Card Created ' + playerId)
	};



	 var readyToStart = function() {
		if(data.newround.course.name != undefined && data.newround.players.length) {
			return true;
		}
		return false;
	};


	var addStroke = function(player) {
		var hole = data.currentHole;
		var strokes = 3;
		if(getHoleScore(player,hole).s){
			strokes = getHoleScore(player,hole).s + 1;
		} else {
			strokes = getHolePar(hole) + 1;
		}
		console.log('hole ' + hole +' player ' + player + ' add stroke: ' + strokes);
		strokes = Math.min(strokes, constants.strokeLimit);
		setHoleScore(player, hole, strokes);
		tallyScores(hole);
	};

	var subStroke = function(player) {
		var hole = data.currentHole;
		var strokes = 3;
		if(getHoleScore(player,hole).s){
			strokes = getHoleScore(player,hole).s - 1;
		} else {
			strokes = getHolePar(hole) - 1;
		}
		console.log('hole ' + hole +' player ' + player + ' sub stroke: ' + strokes);
		strokes = Math.max(strokes, 1);
		setHoleScore(player, hole, strokes);
		tallyScores(hole);
	};

	var markAsPlayed = function() {
		var hole = data.currentHole;
		console.log('mark played on hole ' + hole)
		if(data.players.length) {
			for(var i = 0; i < data.players.length; i++) {
				if(getHoleScore(i,hole).s == 0) {
					console.log('mark p' + i)
					setHoleScore(i, hole, getHolePar(hole));
					tallyScores(hole);
				}
			}
			storeLocalData('data', data);
		}
	};

	var gotoCurrentHole = function() {
		viewHole(data.round.currentHole);
	};

	var editPlayer = function(id,newround,returnPage) {
		console.log('editPlayer ' + id);
		// preload player info
		if(newround) {
			playerData = data.newround.players[id];
		} else {
			playerData = data.players[id];
		}
		if(playerData.img != '') {
			$(uiSelectors.editPlayerPicture).style('background-image', 'url(\'' + playerPic + '\')');
		}
		$(uiSelectors.editPlayer).attr('data-id',id);
		$(uiSelectors.editPlayerName).val(playerData.name);
		$(uiSelectors.editPlayerSave).off('click').on('click',function(){
			savePlayer(newround,returnPage);
		});
		$(uiSelectors.editPlayerCancel).off('click').on('click',function(){
			showPage(returnPage);
		});
		$(uiSelectors.editPlayerRemove).off('click').on('click',function(){
			removePlayer(id,newround);
			showPage(returnPage);
		});		
		showPage('edit-player');
	};

	var savePlayer = function(newround, returnPage) {
		var id = $(uiSelectors.editPlayer).attr('data-id');
		if(newround) {
			playerData = data.newround.players[id];
		} else {
			playerData = data.players[id];
		}
		console.log('savePlayer ' + id);
		playerData.name = $(uiSelectors.editPlayerName).val();
		// refresh playerlist
		updatePlayerList(newround);
		showPage(returnPage);
	};

	var updatePlayerList = function(newround){
		if(newround) {
			var playerData = data.newround.players;
			var playerCount = data.newround.players.length;
		} else {
			var playerData = data.players;
			var playerCount = data.players.length;
		}
		$(uiSelectors.playerList).html('');
		for(var i=0; i < playerCount; i++) {
			var $listitem = $(document.createElement('li')).html(playerData[i].name).attr('data-id',i).off('click').on('click', function(){
				editPlayer($(this).attr('data-id'),true,'new-round');
				});
			$(uiSelectors.playerList).append($listitem);
		}
	};
	var drawScoreChart = function(player, $card) {
		console.log('draw score chart ' + player)
		var scoreCard = getScorecard(player).score;
		var $chart = $(uiSelectors.scoreChart, $card)
		$chart.html('');
		var $name = $(document.createElement('div'));
		$name.html(data.players[player].name).addClass('player');
		var playerScore = getPlayerScore(player);
		if(playerScore > 0) playerScore = '+' + playerScore;
		$name.append('<span>' + playerScore.currentPar + '</span>');
		$chart.append($name);
		for(var i = 0; i<data.round.totalHoles; i++) {
			if(scoreCard[i]) {
				var score = scoreCard[i].s;
				var penalty = scoreCard[i].p;
				var par = getHolePar(i+1);
				var $ele = $(document.createElement('div'));
				$ele.html("<b>" + score + "</b>");
				if(score > par +1) {
					// double bogey
					$ele.addClass('dblbogey');
				} else if(score > par) {
					// bogey
					$ele.addClass('bogey');
				} else if(score == par){
					// par
					$ele.addClass('par');
				} else if (score == 1){
					// ace
					$ele.addClass('ace');	
				} else if (par - score == 1) {
					// birdie
					$ele.addClass('birdie');
				} else if (par - score == 2 ) {
					// eagle
					$ele.addClass('eagle');
				} else {
					$ele.addClass('empty').html('-');
				}

				$chart.append($ele);
			}
		}
		
	};

	var drawScoreChartHeader = function($ele) {
		var holeCount = data.course.holes;
		var par, $cell;
		$ele.html('');
		for(var i = 0; i < holeCount; i++){
			par = getHolePar(i+1);
			$cell = $(document.createElement('div'));
			$cell.html(i+1);
			$ele.append($cell);
		}
	};


// *** utility functions *** 


	var clone = function(obj){
	    if(obj == null || typeof(obj) != 'object')
	        return obj;
	    var temp = new obj.constructor(); 
	    for(var key in obj)
	        temp[key] = clone(obj[key]);
	    return temp;
	};


	var validate = {
		isString: function(value) {
			if($.type(value) === "string") return true;
			return false;
		},
		isNum: function(value) {
			return $.isNumeric(value);
		},
		isArray: function(obj) {
			if($.type(obj) === 'array') return true;
			return false;
		}
	};

	var logError = function(err,param) {
		var errors = {
			'nocard': 'Cannot get scorecard for player {0}',
			'invalidcourse' : 'Invalid course id {0}',
		};
		if(! param) param = '';
		if(err && errors[err]) {
			console.log(errors[err].replace(/\{0\}/,param));
		}
	}

	var getScorecard = function(player) {
		if(data.scorecard[player] != undefined) {
			return data.scorecard[player];
		}
		return false;
	};

	var getPlayerScore = function(player) {
		var card = getScorecard(player);
		if(card) {
			var totalStrokes = 0;
			var currentPar = 0;
			for(var i = 0; i < card.score.length; i++ ){
				if(card.score[i] != undefined && card.score[i].s != 0) {
					totalStrokes +=  card.score[i].s;
					currentPar +=  (card.score[i].s - getHolePar(i));
				} 
			}
			return {'totalStrokes' : totalStrokes, 'currentPar' : currentPar};
		}
		return false;
	};


	var getHoleScore = function(player, hole){
		var card = getScorecard(player);
		if(card) {
			if(card.score[hole]) {
				return card.score[hole];
			} else {
				return false;
			}
		} else {
			logError('nocard',player);
			return false;
		}
	};


	var setHoleScore = function(player, hole, score) {
		if(getHoleScore(player,hole) == false) {
			if(! data.scorecard[player]) {
				data.scorecard[player] = {'player': player, 'score': []};
				console.log('create scorecard ' + player);
			}
			var card = getScorecard(player);
			card.score[hole] = clone(dataTemplates.score);
			card.score[hole].s = getHolePar(hole);
			console.log('create hole score ' + player + ', ' + hole);
			setHoleScore(player, hole, score);
		} else {
			var card = getScorecard(player);
			card.score[hole].s = score;
			console.log('set holeScore p' + player + ' h' + hole + ' s' + score);
		}

	};

	var getHole = function(hole) {
		// returns hole num, par & distance
		try {
			var holeNum = parseInt(hole) + 1;
			var n = (data.course.num.length >= hole && data.course.num[hole]) || holeNum;
			var p = (data.course.par.length >= hole && data.course.par[hole]) || data.round.defaultPar;
			var d = (data.course.dist.length >= hole && data.course.dist[hole]) || 0;
			return {n: n, p: p, d: d};		
		} catch(e) {
			console.log(e)
			return {n: 0, p: data.round.defaultPar, d: 0};
		}
	
	};

	var getHolePar = function(hole) {
		return getHole(hole).p;
	};

	var showScoreCard = function() {
		console.log('showScoreCard');
		var $list = $(uiSelectors.scoreChartListItems);
		// fill the cards
		for(var i = 0; i < data.players.length; i++) {
			if($list.length == 1) {
				$card = $list.eq(0).clone().appendTo($list.parent());
			} else {
				$card = $list.eq(i+1);
			}
			console.log($card)
			drawScoreChart(i, $card);			
		}
		// set the header
		drawScoreChartHeader($(uiSelectors.scoreChartListHdr));
		showPage('score-card');
	};


	var setUIActions = function(){
	};

	var tallyScores = function(hole){
		var hole = data.currentHole;
		var $page = $('#hole-0');
		if($page && $(uiSelectors.playerCards, $page).length){
			var $playerCards = $(uiSelectors.playerCards, $page);
			$playerCards.each(function(){
				var $card = $(this);
				var playerId = $card.attr('data-id');
				var player = parseInt(playerId);
				// update player name & icon
				$(uiSelectors.playerName,$card).html(data.players[playerId].name);

				if($card && getPlayerScore(player)) {
					console.log('tally ' + player);
					console.log(getPlayerScore(player));
					$card.removeClass('played');
					if(getHoleScore(player,hole).s){
						holeScore = getHoleScore(player,hole).s;
						$card.addClass('played');
						$(uiSelectors.strokes, $card).html(holeScore);	
						// update round totals			
						var currentPar = getPlayerScore(player).currentPar;
						if(currentPar > 0) currentPar = '+' + currentPar;
						$(uiSelectors.playerRoundScore, $card).html(getPlayerScore(player).totalStrokes);
						$(uiSelectors.playerRoundPar, $card).html(currentPar);
						
					}  else {
						$(uiSelectors.strokes, $card).html(getHolePar(hole));	
					}
					drawScoreChart(player, $card, false);
				}
			});
		}
	};


	var refreshHolePage = function(hole) {
		var $page = $('#hole-0');
		var nextHole = parseInt(hole) + 1;
		console.log('refresh ' +  hole);
		$(uiSelectors.holeNumber,$page).html('Hole ' + getHole(hole).n);

		// next/prev
		$(uiSelectors.prevHole).show();
		$(uiSelectors.nextHole).show();
		if(hole <= 0) {
			$(uiSelectors.prevHole).hide();
		}
		if(hole >= data.round.totalHoles - 1) {
			$(uiSelectors.nextHole).hide();
		}
		
		if(getHole(hole).d) {
			$(uiSelectors.holeInfo,$page).html('Par ' + getHolePar(hole) + ' &middot; ' + getHole(hole).d + 'ft');
		} else {
			$(uiSelectors.holeInfo,$page).html('Par ' + getHolePar(hole));
		}
		$(uiSelectors.courseName,$page).html(data.course.name);

		for(var i = 0; i < data.players.length; i++) {
			var player = i;
			// create scores
			var card = getScorecard(player);
			if(! card.score[hole]) {
				card.score[hole] = clone(dataTemplates.score);
			}
		}
	};

	var viewHole = function(attr) {
		// change to next page
		// todo: clone a temp page and slide in animate
		if(attr == 'next' && data.currentHole < data.course.holes) {
			data.currentHole++;
		} else if(attr == 'prev' && data.currentHole > 0){
			data.currentHole--;
		} else {
			data.currentHole = attr;
		}
		console.log('view ' + '#hole-' + (data.currentHole+1));
		refreshHolePage(data.currentHole);
		tallyScores(data.currentHole);
		showPage('hole-0');

	};

	var showPage = function(pageid) {
		pageid = pageid.replace('#','');
		console.log('show page: ' + pageid);
		window.scrollTo(0,0);
		if(pageActions[pageid]) {
			console.log('page action')
			pageActions[pageid].call(this);
		}
		$('#' + pageid).addClass('show');
		setTimeout(function(){
			hidePages($('#' + pageid));
		},250);
		pushHistory(pageid);
	};

	var hidePages = function($exception) {
		$('[data-role="page"]').not($exception).removeClass('show');
	};

	var getLocation = function() {
		if (navigator && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showLocation);
        } else {
            console.log('Geolocation is not supported');
		}
	};

	var showLocation = function(position) {
		console.log(position)
		openModal({
			'header' : 'Location',
			'content' : 'Lat: ' + position.coords.latitude + '<br> Lon: ' + position.coords.longitude
		})
	};

	var pushHistory = function(hash) {
		if(history.pushState) {
		    history.pushState(null, null, '#' + hash);
		}
		else {
		    location.hash = '#' + hash;
		}
	};

	var readHistory = function() {
		var hash = window.location.hash.replace('#','');
		if(hash) {
			console.log(hash)
			showPage(hash);
			return true;
		}
		return false;
	};

	var storePlayedCourse = function(data) {
		// Add this course data (single) to the local storage object
		// and overwrite if it matches the name of an existing course
		console.log('save course to local storage')
		var savedCourses = readLocalData('savedCourses');
		if(savedCourses) {
			for(var i = 0; i < savedCourses.length; i++) {
				if(data.name == savedCourses[i].name) {
					console.log('replace existing saved course')
					savedCourses.splice(i,1);
					break;
				}
			}
		} else {
			savedCourses = [];
		}
		savedCourses.push(data);
		storeLocalData('savedCourses', savedCourses);
	};

	var storePlayerList = function(list) {
		if(readLocalData('savedPlayers')) {
			var data = readLocalData('savedPlayers');
		} else {
			var data = [];
		}
		for(var i = 0; i < list.length; i++) {
			found = false;
			playerData = list[i];
			for (var j = 0; j < data.length; j++) {
				if(playerData.uid == data[j].uid) {
					found = true;
				}
			}
			if(!found) {
				data.push(playerData)
			}
		}
		storeLocalData('savedPlayers', data);
	};

	var storeLocalData = function(key,data) {
		try {
			window.localStorage.setItem(key,JSON.stringify(data));
			console.log('Saved local '+ key)
			return true;
		}
		catch(e) {
			return false;
		}
	};

	var readLocalData = function(key) {
		try {
			return JSON.parse(window.localStorage.getItem(key));
		}
		catch(e) {
			return false;
		}
	};

	var checkSaved  = function() {
		if(readLocalData('data') && readLocalData('data').round.started) {
			var lastRoundContent = readLocalData('data').meta.date + ' ' + readLocalData('data').course.name;
			$(uiSelectors.lastRoundPLayed).html(lastRoundContent);
			$(uiSelectors.lastRound).show();
			$(uiSelectors.viewScore).show();

			if(readLocalData('data').round.ended == false && data.round.started == false) {
				$(uiSelectors.resumeRound).show();
			}
			data = readLocalData('data');
			console.log('saved data');
			return true
		}
	}

	var sendRequest = function(endpoint, method, data, headers) {
      return new Promise(function (resolve, reject) {
        var req = new XMLHttpRequest();
        req.open(method,endpoint, true);
        req.setRequestHeader('Content-Type', 'application/json');
        req.setRequestHeader('Accept', 'application/json');
        if(headers) {
          for(var key in headers) {
            if(headers.hasOwnProperty(key)) {
              req.setRequestHeader(key, headers[key]);
            }
          }
        }
        req.onload = function() {
          if (this.status >= 200 && this.status < 300) {
            try {
              resolve(JSON.parse(req.response));
            } catch(e) {
              reject({
                status: 0,
                statusText: 'Could not parse response'
              })
            }
          } else {
            reject({
              status: this.status,
              statusText: req.statusText
            });
          }
        };
        req.onerror = function () {
          reject({
            status: this.status,
            statusText: req.statusText
          });
        };
        req.send(JSON.stringify(data));
      });
    };

	var openModal = function(opts) {
		if(opts.header) {
			$(uiSelectors.modalHeader).html(opts.header).show();
		} else {
			$(uiSelectors.modalHeader).html('').hide();
		}
		var mContent = '';
		if(opts.content) {
			mContent += opts.content;
		}
		if(opts.buttons) {
			mContent += '<div class="button-container">'
			for(var i=0; i < opts.buttons.length; i++) {
				mContent += '<button data-action="'+ opts.buttons[i].action + '" class="' + opts.buttons[i].class + '">' + opts.buttons[i].text + '</button>';
			}
			mContent += '</div>';
		}
		$(uiSelectors.modal).on('click', closeModal);
		$(uiSelectors.modalContent).html(mContent);
		$(uiSelectors.modal).show();
		setActions($(uiSelectors.modal));
	};

	var closeModal = function() {
		$(uiSelectors.modal).hide();
	};

	var getCurrentDate = function(){
		var now = new Date;
		var dd = now.getDate();
		var mm = now.getMonth().toFixed +1;
		var yyyy = now.getFullYear();
		var hh = now.getHours();
		var mm = now.getMinutes();
		return {'date' : mm + '/' + dd + "/" + yyyy,
				'time' : hh + ':' + mm}
	}



	var init = function() {	
		console.log('init');

		hidePages();

		setActions();

		showPage('title');
		

	};

	$(document).ready(function(){
		init();	
	});

	window.onhashchange = readHistory;


//})(jQuery)
