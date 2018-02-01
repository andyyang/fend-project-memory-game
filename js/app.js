const MAX_STARS = 3;
const MATCHING_NUMBER = 2;
const CARD_TEMPLATE = ['diamond', 'paper-plane-o', 'anchor', 'bolt', 'cube', 'leaf', 'bicycle', 'bomb'];

/**
 * A object that holds runtime data of the game
 */
const gameData = {};

/**
 * A array that holds all of your cards
 */
const cards = CARD_TEMPLATE.concat(CARD_TEMPLATE.slice(0));

/**
 * Shuffle function from http://stackoverflow.com/a/2450976
 * @param {array} array
 */
function shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

/**
 * Display the cards on the page
 *   - shuffle the list of cards using the "shuffle" method
 *   - loop through each card and create its HTML
 *   - add each card's HTML to the page
 */
function displayCards() {
    const deck = document.querySelector('.deck');

    while(deck.firstChild){
        deck.firstChild.remove();
    }

    shuffle(cards);
    cards.forEach(function(card, index) {
        deck.insertAdjacentHTML('beforeend',
            `<li id="card-${index}" class="card"><i class="fa fa-${card}"></i></li>`);
    });
}



function flipFont(card) {
    card.querySelector('.fa').classList.toggle('fa-flip-horizontal');
}

function flipCard(card) {
    card.classList.remove('flip-out');
    card.classList.add('flip-in');
    card.addEventListener('animationend', function(evt) {
        if ( evt.target && evt.target.classList.contains('flip-in')) {
            flipFont(card);
            card.classList.remove('flip-in');
            card.classList.add('flip-out');
            card.addEventListener('animationend', function(evt) {
                if ( evt.target && evt.target.classList.contains('flip-out')) {
                    card.classList.remove('flip-out');
                }
            }, { once: true });
        }
    }, { once: true });
}

function displayCardSymbol(card) {
    card.classList.add('show', 'open');
}

function hideCardSymbol(card) {
    card.classList.remove('show', 'open');
}

function lockMatchedCards(cards) {
    cards.forEach(function(card) {
        card.classList.add('match', 'bounce');
    });
}

function wobbleUnmatchedCard(card) {
    card.classList.add('unmatch', 'wobble');
    card.addEventListener('animationend', function(evt) {
        if ( evt.target && evt.target.classList.contains('wobble')) {
            card.classList.remove('unmatch', 'wobble');
            hideCardSymbol(card);
            flipCard(card);
        }
    }, { once: true });
}

function hideUnmatchedCards(openCards) {
    const lastCards = openCards.splice(0 - MATCHING_NUMBER);
    lastCards.forEach(wobbleUnmatchedCard);
}

function addToOpenCards(openCards, card) {
    openCards.push(card);
}

function getCardSymbol(card) {
    return card.querySelector('.fa').className.
        split(' ').
        filter(function(e) { return e != 'fa-flip-horizontal' && e != 'fa'}).
        join(' ');
}

function displayMoveCount(moveCount) {
    document.querySelector('.moves').textContent = moveCount;
}

function incrementMoveCount(moveCount) {
    displayMoveCount(++moveCount);
    return moveCount;
}

function displayStars(starCount) {
    const stars = document.querySelector('.stars')

    while(stars.firstChild) {
        stars.firstChild.remove();
    }

    for(let i = 0; i < starCount; i++) {
        stars.insertAdjacentHTML('beforeend', `<li><i class="fa fa-star"></i></li>`);
    }

    for(let i = 0; i < MAX_STARS - starCount; i++) {
        stars.insertAdjacentHTML('beforeend', `<li><i class="fa fa-star-o"></i></li>`);
    }
}

function adjustStars(starCount, moveCount) {
    const oldStarCount = starCount;
    if (moveCount <= 14) {
        starCount = MAX_STARS;
    } else if (moveCount <= 24) {
        starCount = MAX_STARS - 1;
    } else {
        starCount = MAX_STARS - 2;
    }

    if (oldStarCount != starCount) {
        displayStars(starCount);
    }
    return starCount;
}

/**
 * Pad a number with leading zeros
 * @param {number} number
 * @param {number} width the total width of the return string
 * @returns {string}
 */
function zeroFill(number, width) {
    width -= number.toString().length;
    if (width > 0){
        return new Array(width + (/\./.test( number ) ? 2 : 1)).join('0') + number;
    }
    return number + "";
}

/**
 * Display how much time it took to win the game
 */
function handleTimer() {
    const timer = document.querySelector('.timer');
    const now = new Date().getTime();
    const distance = now - gameData.startTime;
    const minutes = zeroFill(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)), 2);
    const seconds = zeroFill(Math.floor((distance % (1000 * 60)) / 1000), 2);
    gameData.spendTime = `${minutes}:${seconds}`;
    timer.innerHTML = gameData.spendTime;
}

function displayFinalScore(gameData) {
    const game_container = document.querySelector('.game-container');
    const score_container = document.querySelector('.score-container');

    game_container.classList.add('hide');
    score_container.classList.remove('hide', 'bounce-out');
    score_container.classList.add('bounce-in');
    score_container.querySelector('.score-message').textContent =
        `With ${gameData.moveCount} Moves, ${gameData.starCount} Stars and ${gameData.spendTime} Minutes.`;
    score_container.querySelector('.loader').classList.add('show');
}

/**
 * Handle the animationend event of bounce out animation of the final score container.
 * Because there is a loader animation in the final score container as well,
 * the event listener need to distinguish the bounce out animation from it by the class names
 * and to remove the listener when it deals with the event of bounce out animation.
 */
function handleFinalScoreBounceOut(evt) {
    const game_container = document.querySelector('.game-container');
    const score_container = document.querySelector('.score-container');

    if ( evt.target && evt.target.classList.contains('bounce-out') &&
            evt.target.classList.contains('score-container')) {
        score_container.classList.remove('bounce-out');
        score_container.classList.add('hide');
        game_container.classList.remove('hide');
        score_container.removeEventListener('animationend', handleFinalScoreBounceOut);
    }
}

function hideFinalScore() {
    const score_container = document.querySelector('.score-container');

    score_container.classList.remove('bounce-in');
    score_container.classList.add('bounce-out');
    score_container.addEventListener('animationend', handleFinalScoreBounceOut);
}

/**
 * Check to see if the last two cards match
 *    + if the cards do match, lock the cards in the open position
 *    + if the cards do not match, hide the cards's symbol
 *    + increment the move counter and display it on the page
 *    + adjust the star rating accroding to the move counter and display it on the page
 *    + if all cards have matched, stop the timer and display a message with the final score
 */
function matchCards(gameData, card) {
    const openCards = gameData.openCards;

    const lastCards = openCards.slice(0 - MATCHING_NUMBER);
    const lastSymbols = lastCards.map(getCardSymbol);

    if (lastSymbols[0] == lastSymbols[1]) {
        lockMatchedCards(lastCards);
    } else {
        hideUnmatchedCards(openCards);
    }

    gameData.moveCount = incrementMoveCount(gameData.moveCount);
    gameData.starCount = adjustStars(gameData.starCount, gameData.moveCount);

    if (openCards.length == cards.length) {
        window.clearInterval(gameData.timerId);
        window.setTimeout(function() {
            displayFinalScore(gameData);
        }, 1000);
    }
}

function isHiddenCard(openCards, element) {
    return element.className == 'card' && ! openCards.includes(element);
        // element.nodeName.toLowerCase() == 'li'
}

/**
 * If a card is clicked:
 *   - display the card's symbol
 *   - add the card to the list of "open" cards
 *   - flip the card
 *   - if the list already has another card, check to see if the two cards match
 */
function responseToClick(evt) {
    const openCards = gameData.openCards;
    const card = evt.target;
    if (card && isHiddenCard(openCards, card)) {
        displayCardSymbol(card);
        addToOpenCards(openCards, card);
        if (openCards.length % MATCHING_NUMBER == 0) {
            flipFont(card);
            matchCards(gameData, card);
        } else {
            flipCard(card);
        }
    }
}

function initializeGame() {
    gameData.openCards = [];
    gameData.moveCount = 0;
    gameData.starCount = MAX_STARS;
    gameData.startTime = new Date().getTime();
    gameData.spendTime = '';
    gameData.timerId = window.setInterval(handleTimer, 1000);

    displayCards();
    displayMoveCount(gameData.moveCount);
    displayStars(gameData.starCount);
}

initializeGame();

/**
 * Set up the event listener for a card.
 */
document.querySelector('.deck').addEventListener('click', responseToClick);

/**
 * Set up the event listener for the restart button.
 */
document.querySelector('.restart').addEventListener('click', initializeGame);
document.querySelector('.btn-restart').addEventListener('click', function() {
    hideFinalScore();
    initializeGame();
});
