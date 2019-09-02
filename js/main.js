(function($) {
	function ajaxStart() {
		$('#progress').show();
	}

	function ajaxStop() {
		$('#progress').hide();
	}

	//Функция которая по ссылке на матч собирает информацию о
    //матчах между текущими командами и возвращает коэфицент разницы в силе
    //между командами (против друг друга)
    function HeadToHead(data)
    {
        var WinsAndLoses = [0,0,0]; //массив содержащий победы, ничьи и поражения
        var j = 0;
        var finalValue = 0;
        //Загружаем по ссылке страницу и заносим в каждый элемент
        //массива победы, ничьи и поражения 1 команды над 2
        	  	for(j = 0; j < 3; j++){
										try{
                    WinsAndLoses[j] = Number($(data).find(".bold")[j].innerText);
									}
									catch(e)
									{
										WinsAndLoses[j] = 0;
									}
                }

                var resultLength = $(data).find('.head-to-head-listing .result').length; //кол-во матчей (длина массива таблицы)
                var roundsLine = ' | '; //строка результатов матчей head-to-head
                var regWin = /\d+(?=\ - )/ig;  //регулярное выражение: находит число, если перед ним есть " - "
                var regLose = /\d+(?=\ I )/ig;  //регулярное выражение: находит число, если перед ним есть " I "
                var winningRounds1 = 0;  //выигранные раунды 1 команды
                var winningRounds2 = 0;  //выигранные раунды 2 команды

                /*Ищем матчи head-to-head, вытаскиваем строчку с результатом
                (например 16-7) и с помощью регулярных выражений суммируем раунды для 1-ой и
                2-ой команды*/
                for(j = 0; j < resultLength; j++){
                    roundsLine += $(data).find('.head-to-head-listing .result')[j].innerText + ' I ';
                    winningRounds1 += Number(regWin.exec(roundsLine)); //массив выигранных раундов у 1 команды над 2
                    winningRounds2 += Number(regLose.exec(roundsLine)); //массив выигранных раундов у 2 команды над 1
                }

                var finalValue = 0;  //финальный коэффициент для 1 команды

                //Вычисляем финальный коэффициент - умножаем выигранные раунды каждой команды на кол-во их побед,
                //вычитаем их и делим на кол-во игр. Если игр не было, возравращаем 0, т.к. разница в силах команд - 0
                finalValue = (((winningRounds1 * WinsAndLoses[0]) - (winningRounds2 * WinsAndLoses[2])) / (WinsAndLoses[0] + WinsAndLoses[2]));
				finalValue = (Math.round(finalValue) / 100);
                if((WinsAndLoses[0] + WinsAndLoses[2]) != 0 && finalValue != NaN){
                	return finalValue;
                	}
                else{
                return 0;
                }
    }


    /*Функция, которая по ссылке на матч находит кол-во игр с другими командами и
    возвращает это значение*/
    function PastMatches(data, number)
    {
    	var teamName1 = $(data).find('.teamName')[0].innerText; //Название 1 команды
    	var teamName2 = $(data).find('.teamName')[1].innerText; //Название 2 команды
    	var gamesHtml1 = $(data).find('.table.matches')[0].innerHTML; //HTML с играми 1 команды
    	var gamesHtml2 = $(data).find('.table.matches')[1].innerHTML; //HTML с играми 2 команды
    	var gamesSum1 = $(gamesHtml1).find('.table').length; //Кол-во игр у 1 команды
    	var gamesSum2 = $(gamesHtml2).find('.table').length; //Кол-во игр у 2 команды

    	if (number == 1)
    	{
    		return gamesSum1;
    	}
    	else
    	{
    		return gamesSum2;
    	}
    }

    /*Функция считает 3 коэффицент: статистика по картам.
    Находим таблицу с информацией по картам, расчитываем очки 2-х команд по
    каждой карте (кол-во сыгранных карт * %побед), выбираем в зависимости от
    кол-ва карт в этом матче (ВО1, ВО2, ВО3, ВО5) ожидаемые карты (карты, где разница по очкам минимальна),
    суммируем очки и возвращаем результат*/
    function MapStats(data)
    {
    	var q;
    	var mapNames = []; //названия карт
    	var mapStats1 = []; //массив со статистикой каждой карты первой команды (%побед)
    	var mapStats2 = []; //массив со статистикой каждой карты второй команды (%побед)
    	var games1 = []; //массив с кол-вом игр на каждой карте 1 команды
    	var games2 = []; //массив с кол-вом игр на каждой карте 2 команды
    	var minDifference = []; //массив с ожидаемыми картами. Хранит разницу в силах между командами на определенной карте

    	/*Регулярные выражения. Вытаскивают числа из строки*/
    	var regGames = /\d+(?=\ maps)/;
    	var regWinPercent = /\d+(?=\%)/;

    	var mapsLength = $(data).find('.map-stats-infobox-maps').length; //кол-во карт (обычно всегда 7, но вдруг старые уберут на доработку или добавят новые)
    	var BestOfNum = $(data).find('.mapholder').length; // формат игры (Бывает BO1 BO2 BO3 BO5)
    	var biggestValue = 0; //Самая большая разница в силах на отдельной карте
    	var indexOfBiggestValue = 0; //Индекс этого элемента в массиве
    	var bannedMaps = mapsLength - BestOfNum; //кол-во карт, которые необходимо убрать
    	var finalValue = 0; //финальный коэффициент
    	var openMapCheck = ''; //переменная для проверки карт, если карты открыты, то считать статистику только поним

    	/*
    	Собираем значения из таблицы с результатами игр на определенных картах.
    	В итоге у нас 4 массива (скорее всего костыль) с кол-вом игр и %побед для каждой команды
    	*/
    	console.log("Формат Матча - ВО" + BestOfNum);
    	for(q = 0; q < mapsLength; q++)
    	{
    		mapNames[q] = $(data).find('.map-stats-infobox-mapname-holder')[q].innerText;
    		games1[q] = Number(regGames.exec($(data).find('.map-stats-infobox-maps-played')[2*q].innerText));
    		if(games1[q] == null){
    			games1[q] = 0;
    		}
    		mapStats1[q] = Number(regWinPercent.exec($(data).find('.map-stats-infobox-winpercentage')[2*q].innerText));
    		if(mapStats1[q] == null){
    			mapStats1[q] = 0;
    		}
    		games2[q] = Number(regGames.exec($(data).find('.map-stats-infobox-maps-played')[(2*q + 1)].innerText));
    		console.log("games2[" + q + "] = " + games2[q]);
    		if(games2[q] == null){
    			games2[q] = 0;
    		}
    		mapStats2[q] = Number(regWinPercent.exec($(data).find('.map-stats-infobox-winpercentage')[(2*q + 1)].innerText));
    		if(mapStats2[q] == null){
    			mapStats2[q] = 0;
    		}
    		console.log("Карта - " + mapNames[q] + " Кол-во игр 1 команды = " + games1[q] + " % побед = " + mapStats1[q]);
    		console.log(" Кол-во игр 2 команды = " + games2[q] + " % побед = " + mapStats2[q]);
    	}

    	/*
    	Смотрим содержание названия первой карты. Если оно "TBA", то карты не обьявили, значит анализируем так:
    	Считаем разницу в силах команд на каждой карте и выбираем те значения, где разница в силах больше всего
    	(если команды не играли 1 карту и у всех 0, => коэффициент меньше, т.к. нет информации). Обнуляем эти значения и
    	считаем сумму всех оставшихся значений в массиве. Возвращаем это значение. Если обьявили карты, то просто суммируем
    	элементы массива до индекса равному кол-ву карт
    	*/
    	openMapCheck = $(data).find('.mapname')[0].innerText;
    	//console.log('openMapCheck = ' + openMapCheck);
    	if(openMapCheck == 'TBA')
    	{
    		for(q = 0; q < mapsLength; q++)
    		{
    			minDifference[q] = (games1[q] * (mapStats1[q] * 0.001)) - (games2[q] * (mapStats2[q] * 0.001));
    			//console.log('Разница сил на карте - ' + minDifference[q]);
    		}
    		while(bannedMaps != 0)
    		{
    			for(q = 0; q < mapsLength; q++)
				{
					if(Math.abs(minDifference[q]) > Math.abs(biggestValue))
    				{
    					biggestValue = minDifference[q];
    					indexOfBiggestValue = q;
    				}
    			}
    			biggestValue = 0;
    			minDifference[indexOfBiggestValue] = 0;
    			bannedMaps--;
    		}

    		for(q = 0; q < mapsLength; q++)
    		{
    			finalValue += minDifference[q];
    		}
    		return (Math.round(finalValue*100) * 0.01);
    	}
    	else
    	{
			console.log('Карты известны');
    		for(q = 0; q < BestOfNum; q++)
    		{
				//console.log('games1[q] = ' + games1[q] + ' mapStats1[q] ' + mapStats1[q] + ' games2[q] ' + games2[q] + ' mapStats2[q] ' + mapStats2[q]);
    			finalValue += (games1[q] * (mapStats1[q] * 0.001)) - (games2[q] * (mapStats2[q] * 0.001));
    		}
    		return (Math.round(finalValue*100) * 0.01);
    	}
    }

    function PastMatchesAnalize(data, number)
    {
    	var commandHTML = ''; //HTML матча с командой
    	var commandURL = 'https://www.hltv.org'; //ссылка на команду

    	commandHTML = $(data).find('.opponent')[number].innerHTML;
    	commandURL += $(commandHTML).find('a').attr('href');
    	return commandURL;
    }

		function MatchScore(data, number)
		{
			//var scoreHTML = $(data).find('.table.matches')[commandNum].innerHTML;
			var scoreLine = $(data).find('.spoiler.result')[number].innerText; //строчка для хранения результата матча
			return scoreLine;
		}

    function FindRating(data)
    {
    	var commandRangLine = '';
			var commandName =  ''; //$(data).find('.profile-team-container').innerText;
    	var commandRang = 0; //Место команды в рейтинге (число, полученное после преобразования регулярным выражением)
    	var regRang = /\d+/;

			try
			{
				commandRangLine = $(data).find('.profile-team-stat a')[0].innerText; //Место команды в рейтинге (строка)
			}
			catch(e)
			{
				commandRangLine = 0;
			}
    	commandRang = Number(regRang.exec(commandRangLine));
			console.log('Рейтинг команды ' + commandName + ' - ' + commandRang);

			if(commandRang != NaN) {return commandRang;}
			else {return 0;}
    }

		function CalculateRating(rating, string)
		{
			var scoreString = string + ' I ';
			var regWin = /\d+(?=\ - )/;  //регулярное выражение: находит число, если перед ним есть " - "
			var regLose = /\d+(?=\ I )/;  //регулярное выражение: находит число, если перед ним нет " - "
			var winGames = Number(regWin.exec(scoreString));
			var loseGames = Number(regLose.exec(scoreString));
			var winDiff = 0;
			var commandRang = rating;

			console.log('string ' + scoreString + ' rating ' + rating + ' winGames ' + winGames + ' loseGames ' + loseGames);
			if((winGames + loseGames) < 6)
			{
				winDiff = winGames - loseGames;
				if(winDiff <= 0)
				{
					commandRang = commandRang * winDiff;
				}
				else
				{
					commandRang = (250 - commandRang) * winDiff;
				}
			}
			else
			{
				if(winGames <= loseGames)
				{
					commandRang = commandRang * (-1);
				}
				else
				{
					commandRang = 250 - commandRang;
				}
			}
			console.log('commandRang - ' + commandRang);

			return (Number(commandRang / 1000));
		}

		function SearchNames(data)
		{
			var firstTeamName = '';
			var secondTeamName = '';
			try{
				firstTeamName = $(data).find('.team-cell')[0].innerText;
			}
			catch(e)
			{
				firstTeamName = '';
			}
			try{
				secondTeamName = $(data).find('.team-cell')[2].innerText;
			}
			catch(e)
			{
				secondTeamName = '';
			}
			var result = firstTeamName + ' vs ' + secondTeamName;
			return result;
		}

		function reqReadyStateChange() {
		    if (request.readyState == 4) {
		        var status = request.status;
		        if (status == 200) {
		            //document.getElementById("output").innerHTML=request.responseText;
								$('#resultbox').html(request.responseText);
		        }
		    }
		}

	//Функция которая запускает парсер сайта hltv.org
	function parserHLTV() {
		ajaxStart();
		var iterations = 0; //кол-во итераций (счетчик массива для ссылок)
		new Array(100); //массив матчей
		var i = 0; //счетчик для for-а, анализирующего матчи
		var j = 0; //счетчик для For-a, который смотрит рейтинг команд
		var q = 0; //
		var firstHeadToHead = []; //1-ый коэффицент алгоритма, показывающий прошлые игры команд
		var thirdMapStats = []; // 3-ий коэф алгоритма, показывающий разницу в силах на отделных картах
		var PastMatchesMass = [];
		var secondValue = [];
		var secondPastMatches1 = 0; //2-ой коэффициент алгоримта для 1 команды, показывающий разницу между командами в их прошлых играх с другими командами
		var secondPastMatches2 = 0; //2-ой коэффициент алгоримта для 2 команды, показывающий разницу между командами в их прошлых играх с другими командами
		var gamesArray1 = []; //Массив, содержащий ссылки на команд, игравшие с 1 командой (нужен, чтобы находить 2 коэффицент)
		var gamesArray2 = []; //Массив, содержащий ссылки на команд, игравшие с 2 командой (нужен, чтобы находить 2 коэффицент)
		var scoreMass1 = []; // Массив, содержащий результаты матчей, игравшие с 1 командой (нужен, чтобы находить 2 коэффицент)
		var scoreMass2 = []; // Массив, содержащий результаты матчей, игравшие с 1 командой (нужен, чтобы находить 2 коэффицент)
		var gamesValue1 = 0; //сумма матчей, сыгранных с другими командами.
		var gamesValue2 = 0;

		request = new XMLHttpRequest(); //запрос к серверу, который отправляет данные
		var requestBody = ''; //строка для отправки на сервер
		var matchStats = {}; //структура, описывающая все аспекты матча (имя команд, все коэффициенты и время начала матча)

		/*$.ajax('https://betscsgo.com/').done(function(data){
			alert('я тут');
			console.log(data);
	 });*/
		//Заходим на страну со списком матчей и заносим в массив все ссылки
		$.ajax('https://www.hltv.org/matches/').done(function(data) {
			$(data).find('.match-day a').each(function() {
				var name = this.innerText; //название матча
				Array[iterations] = 'https://www.hltv.org' + $(this).attr('href'); //ссылка на матч
				console.log((iterations+1) + ' ' + 'ссылка' + ' ' + Array[iterations]);
				iterations++;
			})
			console.log('iterations = ' + iterations + ' i = ' + i);

			//for(i = 0; i < iterations; i++)
			//За один проход берем со всех матчей статистику по командам
			for(i = 0; i < 1; i++)
			{
				console.log('я зашел в For' + i);
				/*$.getScript("/js/BetscsgoParser.js", function(){ alert('загружен скрипт betscsgo'); });*/
				/*1 ajax запрос - вычисляем 1 коэффицент, head-to-head*/
				$.ajax(Array[i]).done(function(data){
					matchStats.teamsName = SearchNames(data);
					console.log(matchStats.teamsName);
					firstHeadToHead[i] = HeadToHead(data);
					console.log('мне передался из функции 1 коэффицент = ' + firstHeadToHead[i]);

					/*Вычисляем 2 коэффициент. Находим кол-во прошлых игр у 1 и 2 команды по отдельности,
					заходим по ссылке на страницу команды, с которыми играли и вытаскиваем их место в рейтинге*/
					gamesValue1 = PastMatches(data, 1);
					console.log('gamesValue1 = ' + gamesValue1);
					gamesValue2 = PastMatches(data, 2);
					console.log('gamesValue2 = ' + gamesValue2);
					for(j = 0; j < gamesValue1; j++)
					{
						gamesArray1[j] = PastMatchesAnalize(data, j);
						scoreMass1[j] = MatchScore(data, j);
						//console.log('ссылка для 1 команды - ' + gamesArray1[j]);
						//console.log('результат матча ' + scoreMass1[j]);
					}
					for(j = gamesValue1; j < (gamesValue1 + gamesValue2); j++)
					{
						gamesArray2[j] = PastMatchesAnalize(data, j);
						scoreMass2[j] = MatchScore(data, j);
						//console.log('ссылка для 2 команды - ' + gamesArray2[j]);
						//console.log('результат матча ' + scoreMass2[j]);
					}
					for(j = 0; j < gamesValue1; j++)
					{
						$.ajax({url: gamesArray1[j],
						async:false}).done(function(data){
							//console.log('scoreLine = ' + scoreMass1[j]);
							PastMatchesMass[j] = FindRating(data);
							console.log('Рейтинг ' + (j + 1) + ' команды (для 1 команды) ' + PastMatchesMass[j]);
							secondPastMatches1 += CalculateRating(PastMatchesMass[j], scoreMass1[j]);
						})
					};
					//console.log('secondPastMatches1 = ' + secondPastMatches1);
					for(j = gamesValue1; j < (gamesValue2 + gamesValue1); j++)
					{
						$.ajax({url: gamesArray2[j],
						async:false}).done(function(data){
							//console.log('scoreLine = ' + scoreMass1[j]);
							PastMatchesMass[j] = FindRating(data);
							console.log('Рейтинг ' + (j + 1 - gamesValue1) + ' команды (для 2 команды) ' + PastMatchesMass[j]);
							secondPastMatches2 += CalculateRating(PastMatchesMass[j], scoreMass2[j]);
						})
					};
					//console.log('secondPastMatches2 = ' + secondPastMatches2);
					secondValue[i] = secondPastMatches1 - secondPastMatches2;
					console.log('2-ой коэффицент = ' + secondValue[i]);
					thirdMapStats[i] = MapStats(data);
					console.log('мне передался из функции 3 коэффицент = ' + thirdMapStats[i]);
					q++;

					requestBody = "name=" + matchStats.teamsName + "&firstValue=" + firstHeadToHead[i] + "&secondValue=" + secondValue[i] + "&thirdValue=" + thirdMapStats[i];
					console.log(requestBody);
					request.open("GET", "http://localhost/postdata.php?"+requestBody);
					request.onreadystatechange = reqReadyStateChange();
					request.send();

					setTimeout(function() {
						CalculateResult(firstHeadToHead[i], secondValue[i], thirdMapStats[i], q);
					}, 1000);
					});
			}
			//$('#resultbox').html(c)
		});
	}

	function CalculateResult(firstV, secondV, thirdV, q)
	{
		console.log('firstV, secondV, thirdV, q - ' + firstV + ' ' + secondV + ' ' + thirdV + ' ' + q);
		alert('Разница в силах в ' + q + ' матче ' + (Math.round(((8 * firstV) + (4 * secondV) + (2 * thirdV)) * 100) * 0.01) + '. Умножь на мультипликатор и подели на коэфицент ставки');
		console.log('Разница в силах в ' + q + ' матче ' + (Math.round(((8 * firstV) + (4 * secondV) + (2 * thirdV)) * 100) * 0.01) + '. Умножь на мультипликатор и подели на коэфицент ставки');
	}

	function analysisSite(data) {
		var res = '';
		$(data).find('a').each(function() {
			res += $(this).text() + '=>' + $(this).attr('href') + '';
		})
		$('#resultbox').html(res);
	}
	$(function() {
		$('#progress').hide();
		$('#starter').click(parserHLTV);
	});
})(jQuery);
