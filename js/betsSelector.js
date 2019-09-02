(function($) {
  /*Глобальные переменные*/
  var ownSessionToken = "";
  var multiplicator = 3;
  var logsDate = new Date();
  var hotfixMatchID = 0;
  var maps = ["Cache", "Dust 2", "Mirage", "Inferno", "Nuke", "Train", "Overpass"];

  function ajaxStart() {
    $('#progress').show();
  }

  function ajaxStop() {
    $('#progress').hide();
  }
  //Функция которая по ссылке на матч собирает информацию о
  //матчах между текущими командами и возвращает коэфицент разницы в силе
  //между командами (против друг друга)
  function HeadToHead(data) {
    var WinsAndLoses = [0, 0, 0]; //массив содержащий победы, ничьи и поражения
    var j = 0;
    var finalValue = 0;
    //Загружаем по ссылке страницу и заносим в каждый элемент
    //массива победы, ничьи и поражения 1 команды над 2
    for (j = 0; j < 3; j++) {
      try {
        WinsAndLoses[j] = Number($(data).find(".bold")[j].innerText);
      } catch (e) {
        WinsAndLoses[j] = 0;
      }
    }

    var resultLength = $(data).find('.standard-box.head-to-head-listing .result').length; //кол-во матчей (длина массива таблицы)
    console.log(resultLength);
    var roundsLine = ' | '; //строка результатов матчей head-to-head
    var regWin = /\d+(?=\ - )/ig; //регулярное выражение: находит число, если перед ним есть " - "
    var regLose = /\d+(?=\ I )/ig; //регулярное выражение: находит число, если перед ним есть " I "
    var winningRounds1 = 0; //выигранные раунды 1 команды
    var winningRounds2 = 0; //выигранные раунды 2 команды

    /*Ищем матчи head-to-head, вытаскиваем строчку с результатом
    (например 16-7) и с помощью регулярных выражений суммируем раунды для 1-ой и
    2-ой команды*/
    for (j = 0; j < resultLength; j++) {
      roundsLine += $(data).find('.standard-box.head-to-head-listing .result')[j].innerText + ' I ';
      winningRounds1 += Number(regWin.exec(roundsLine)) / (j + 1); //массив выигранных раундов у 1 команды над 2
      winningRounds2 += Number(regLose.exec(roundsLine)) / (j + 1); //массив выигранных раундов у 2 команды над 1
      console.log(roundsLine + winningRounds1 + ' ' + winningRounds2);
    }

    var finalValue = 0; //финальный коэффициент для 1 команды

    //Вычисляем финальный коэффициент - умножаем выигранные раунды каждой команды на кол-во их побед,
    //вычитаем их и делим на кол-во игр. Если игр не было, возравращаем 0, т.к. разница в силах команд - 0
    finalValue = (((winningRounds1 * WinsAndLoses[0]) - (winningRounds2 * WinsAndLoses[2])) / (WinsAndLoses[0] + WinsAndLoses[2]));
    finalValue = (Math.round(finalValue) / 100);
    if ((WinsAndLoses[0] + WinsAndLoses[2]) != 0 && finalValue != NaN) {
      return finalValue;
    } else {
      return 0;
    }
  }


  /*Функция, которая по ссылке на матч находит кол-во игр с другими командами и
  возвращает это значение*/
  function PastMatches(data, number) {
    try {
      var teamName1 = $(data).find('.teamName')[0].innerText; //Название 1 команды
      var teamName2 = $(data).find('.teamName')[1].innerText; //Название 2 команды
      var gamesHtml1 = $(data).find('.table.matches')[0].innerHTML; //HTML с играми 1 команды
      var gamesHtml2 = $(data).find('.table.matches')[1].innerHTML; //HTML с играми 2 команды
      var gamesSum1 = $(gamesHtml1).find('.table').length; //Кол-во игр у 1 команды
      var gamesSum2 = $(gamesHtml2).find('.table').length; //Кол-во игр у 2 команды
    } catch (e) {
      return 0;
    }

    if (number == 1) {
      return gamesSum1;
    } else {
      return gamesSum2;
    }
  }

  /*Функция, которая сортирует массив карт. Нет смысла использовать быструю сортировку, т.к. всего 7 элементов
  Создаем локальный массив и вставляем самый большой элемент а в исходном удаляем его, и так пока элементы
  не закончатся. Возвращает локальный массив*/
  function SortMapArray(mapsArray, mapsName) {
    var resultArray = [];
    var resultInd = 0;
    var biggestNum = -999;
    var biggestInd = 0;
    var saveNum = 0;
    var saveName = 0;

    for (var j = 0; j < 7; j++) {
      for (var i = 0; i < (7 - j); i++) {
        if (mapsArray[i + j] > biggestNum) {
          biggestNum = mapsArray[i + j];
          biggestInd = i + j;
        }
      }

      saveNum = mapsArray[j];
      mapsArray[j] = mapsArray[biggestInd];
      mapsArray[biggestInd] = saveNum;

      saveName = maps[j];
      maps[j] = maps[biggestInd];
      maps[biggestInd] = saveName;

      biggestNum = -999;
      /*resultArray[resultInd] = biggestNum;
        maps[resultInd] = mapsName[biggestInd];
      biggestNum = -999;
      resultInd++;*/
    }
    return mapsArray;
  }

  /*Функция считает 3 коэффицент: статистика по картам.
  Находим таблицу с информацией по картам, расчитываем очки 2-х команд по
  каждой карте (кол-во сыгранных карт * %побед), выбираем в зависимости от
  кол-ва карт в этом матче (ВО1, ВО2, ВО3, ВО5) ожидаемые карты (карты, где разница по очкам минимальна),
  суммируем очки и возвращаем результат*/
  function MapStats(data) {
    try {
      var q;
      var mapNames = []; //названия карт
      var mapStats1 = []; //массив со статистикой каждой карты первой команды (%побед)
      var mapStats2 = []; //массив со статистикой каждой карты второй команды (%побед)
      var games1 = []; //массив с кол-вом игр на каждой карте 1 команды
      var games2 = []; //массив с кол-вом игр на каждой карте 2 команды
      var minDifference = []; //массив с ожидаемыми картами. Минимальная разница. Хранит разницу в силах между командами на определенной карте
      var maxDifference = []; //массив с ожидаемыми картами. Максимальная разница. Хранит разницу в силах между командами на определенной карте

      /*Регулярные выражения. Вытаскивают числа из строки*/
      var regGames = /\d+(?=\ maps)/;
      var regWinPercent = /\d+(?=\%)/;

      var mapsLength = $(data).find('.map-stats-infobox-maps').length; //кол-во карт (обычно всегда 7, но вдруг старые уберут на доработку или добавят новые)
      var BestOfNum = $(data).find('.mapholder').length; // формат игры (Бывает BO1 BO2 BO3 BO5)
      var biggestValue = 0; //Самая большая разница в силах на отдельной карте
      var lowestValue = 999; //Самая маленькая разница в силах на отдельной карте
      var lowestInd = 0;
      var previousValue = 0; //Предыдущая разница в силах на отдельной карте
      var maxDifIndex = 0; //индекс для maxDifference, чтобы не выходить за рамки массива
      var indexOfBiggestValue = 0; //Индекс этого элемента в массиве
      var bannedMaps = mapsLength - BestOfNum; //кол-во карт, которые необходимо убрать
      var finalValue = 0; //финальный коэффициент
      var openMapCheck = ''; //переменная для проверки карт, если карты открыты, то считать статистику только поним
      var Maps = ["Cache", "Dust 2", "Mirage", "Inferno", "Nuke", "Train", "Overpass"];

      /*
      Собираем значения из таблицы с результатами игр на определенных картах.
      В итоге у нас 4 массива (скорее всего костыль) с кол-вом игр и %побед для каждой команды
      */
      console.log("Формат Матча - ВО" + BestOfNum);
      for (q = 0; q < mapsLength; q++) {
        mapNames[q] = $(data).find('.map-stats-infobox-mapname-holder')[q].innerText;
        games1[q] = Number(regGames.exec($(data).find('.map-stats-infobox-maps-played')[2 * q].innerText));
        if (games1[q] == null) {
          games1[q] = 0;
        }
        mapStats1[q] = Number(regWinPercent.exec($(data).find('.map-stats-infobox-winpercentage')[2 * q].innerText));
        if (mapStats1[q] == null) {
          mapStats1[q] = 0;
        }
        games2[q] = Number(regGames.exec($(data).find('.map-stats-infobox-maps-played')[(2 * q + 1)].innerText));
        console.log("games2[" + q + "] = " + games2[q]);
        if (games2[q] == null) {
          games2[q] = 0;
        }
        mapStats2[q] = Number(regWinPercent.exec($(data).find('.map-stats-infobox-winpercentage')[(2 * q + 1)].innerText));
        if (mapStats2[q] == null) {
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
      if (openMapCheck == 'TBA') {
        /*Записываем разницу в силах на каждой карте*/
        for (q = 0; q < mapsLength; q++) {
          minDifference[q] = (games1[q] * (mapStats1[q] * 0.001)) - (games2[q] * (mapStats2[q] * 0.001));
          //maxDifference[q] = (games1[q] * (mapStats1[q] * 0.001)) - (games2[q] * (mapStats2[q] * 0.001));
          //console.log('Разница сил на карте - ' + minDifference[q]);
        }

        minDifference = SortMapArray(minDifference, Maps);
        console.log("Карты " + maps);

        document.getElementById("logs").innerHTML += "<p>Анализируем статистику по картам."
        /*В зависимости от кол-ва карт решаем что делать*/
        switch (BestOfNum) {
          case 1:
            for (var i = 0; i < mapsLength; i++) {
              if (Math.abs(minDifference[i]) < Math.abs(lowestValue)) {
                lowestValue = minDifference[i];
                lowestInd = i;
              }
            }
            document.getElementById("logs").innerHTML += "<p>Пытаемся угадать выпавшую карту - " + maps[lowestInd];
            /*пик карты в лог*/
            finalValue += lowestValue;
            return (Math.round(finalValue * 100) * 0.01);
            break;

          case 2:
            for (var i = 0; i < mapsLength; i++) {
              if (Math.abs(minDifference[i]) < Math.abs(lowestValue)) {
                lowestValue = minDifference[i];
                lowestInd = i;
              }
            }
            document.getElementById("logs").innerHTML += "<p>Пытаемся угадать выпавшую карту - " + maps[lowestInd];

            if (Math.abs(minDifference[lowestInd + 1]) > Math.abs(minDifference[lowestInd - 1])) {
              lowestValue += minDifference[lowestInd - 1];
              document.getElementById("logs").innerHTML += "<p>Пытаемся угадать выпавшую карту - " + maps[lowestInd - 1];
            } else {
              lowestValue += minDifference[lowestInd + 1];
              document.getElementById("logs").innerHTML += "<p>Пытаемся угадать выпавшую карту - " + maps[lowestInd + 1];
            }
            /*пик карты в лог*/
            finalValue += lowestValue;
            return (Math.round(finalValue * 100) * 0.01);
            break;
          case 3:
            for (var i = 0; i < mapsLength; i++) {
              if (Math.abs(minDifference[i]) < Math.abs(lowestValue)) {
                lowestValue = minDifference[i];
                lowestInd = i;
              }
            }
            document.getElementById("logs").innerHTML += "<p>Пытаемся угадать выпавшую карту(3-ая) - " + maps[lowestInd];
            if (lowestInd != 1 && lowestInd != 5) {
              lowestValue += minDifference[1] + minDifference[5];
              document.getElementById("logs").innerHTML += "<p>Пытаемся угадать выпавшие карты(пики 1 и 2 команды) - " + maps[1] + " и " + maps[5];
            } else {
              if (lowestInd == 1) {
                lowestValue += minDifference[2] + minDifference[5];
                document.getElementById("logs").innerHTML += "<p>Пытаемся угадать выпавшие карты(пики 1 и 2 команды) - " + maps[2] + " и " + maps[5];
              } else {
                lowestValue += minDifference[1] + minDifference[4];
                document.getElementById("logs").innerHTML += "<p>Пытаемся угадать выпавшие карты(пики 1 и 2 команды) - " + maps[1] + " и " + maps[4];
              }
            }
            /*пик карты в лог*/
            finalValue += lowestValue;
            return (Math.round(finalValue * 100) * 0.01);
            break;
          case 5:
            minDifference[0] = 0;
            minDifference[6] = 0;
            document.getElementById("logs").innerHTML += "<p>Пытаемся угадать выпавшие карты. Все кроме " + maps[0] + " и " + maps[6];
            for (var i = 0; i < mapsLength; i++) {
              lowestValue += minDifference[i];
            }
            /*пик карты в лог*/
            finalValue += lowestValue;
            return (Math.round(finalValue * 100) * 0.01);
            break;
        }

        return (Math.round(finalValue * 100) * 0.01);
      } else {
        console.log('Карты известны');
        for (q = 0; q < BestOfNum; q++) {
          //console.log('games1[q] = ' + games1[q] + ' mapStats1[q] ' + mapStats1[q] + ' games2[q] ' + games2[q] + ' mapStats2[q] ' + mapStats2[q]);
          finalValue += (games1[q] * (mapStats1[q] * 0.001)) - (games2[q] * (mapStats2[q] * 0.001));
        }
        return (Math.round(finalValue * 100) * 0.01);
      }
    } catch (e) {
      return 0;
    }
  }

  function PastMatchesAnalize(data, number) {
    var commandHTML = ''; //HTML матча с командой
    var commandURL = 'https://www.hltv.org'; //ссылка на команду

    commandHTML = $(data).find('.opponent')[number].innerHTML;
    commandURL += $(commandHTML).find('a').attr('href');
    return commandURL;
  }

  function MatchScore(data, number) {
    //var scoreHTML = $(data).find('.table.matches')[commandNum].innerHTML;
    var scoreLine = $(data).find('.spoiler.result')[number].innerText; //строчка для хранения результата матча
    return scoreLine;
  }

  function FindRating(data) {
    var commandRangLine = '';
    var commandName = ''; //$(data).find('.profile-team-container').innerText;
    var commandRang = 0; //Место команды в рейтинге (число, полученное после преобразования регулярным выражением)
    var regRang = /\d+/;

    try {
      commandRangLine = $(data).find('.profile-team-stat a')[0].innerText; //Место команды в рейтинге (строка)
    } catch (e) {
      commandRangLine = 0;
    }
    commandRang = Number(regRang.exec(commandRangLine));
    console.log('Рейтинг команды ' + commandName + ' - ' + commandRang);

    if (commandRang != NaN) {
      return commandRang;
    } else {
      return 0;
    }
  }

  function CalculateRating(rating, string) {
    var scoreString = string + ' I ';
    var regWin = /\d+(?=\ - )/; //регулярное выражение: находит число, если перед ним есть " - "
    var regLose = /\d+(?=\ I )/; //регулярное выражение: находит число, если перед ним нет " - "
    var winGames = Number(regWin.exec(scoreString));
    var loseGames = Number(regLose.exec(scoreString));
    var winDiff = 0;
    var commandRang = rating;

    console.log('string ' + scoreString + ' rating ' + rating + ' winGames ' + winGames + ' loseGames ' + loseGames);
    if ((winGames + loseGames) < 6) {
      winDiff = winGames - loseGames;
      if (winDiff <= 0) {
        commandRang = commandRang * winDiff;
      } else {
        commandRang = (250 - commandRang) * winDiff;
      }
    } else {
      if (winGames <= loseGames) {
        commandRang = commandRang * (-1);
      } else {
        commandRang = 250 - commandRang;
      }
    }
    console.log('commandRang - ' + commandRang);

    return (Number(commandRang / 1000));
  }

  function SearchNames(data) {
    var firstTeamName = '';
    var secondTeamName = '';
    try {
      firstTeamName = $(data).find('.team-cell')[0].innerText;
    } catch (e) {
      firstTeamName = '';
    }
    try {
      secondTeamName = $(data).find('.team-cell')[2].innerText;
    } catch (e) {
      secondTeamName = '';
    }
    var result = firstTeamName + ' vs ' + secondTeamName;
    return result;
  }

  function reqReadyStateChange(checkID) {
    if (request.readyState == 4) {
      var status = request.status;
      if (status == 200) {
        //document.getElementById("output").innerHTML=request.responseText;
        //$('#resultbox').html(request.responseText);
        serverReturn = request.responseText;
        console.log(serverReturn);

        finalRequest.open("GET", serverReturn, false);
        finalRequest.send();
        finalRequest.onreadystatechange = FinishRequestToBetService(checkID);
      }
    }
  }

  function SearchWinKoef(data, num) {
    try {
      var result = 0;
      result = Number($(data).find('.egb-nolink.geoprovider_egbnolink.betting_provider .odds-cell.border-left')[num].innerText);
      return result;
    } catch (e) {
      result = 1.3;
    }
  }

  function FindGamesLength(data) {
    var BestOfNum = $(data).find('.mapholder').length; // формат игры (Бывает BO1 BO2 BO3 BO5)
    return BestOfNum;
  }

  //Функция которая запускает парсер сайта hltv.org
  function parserHLTV(firstNameFromBets, secondNameFronBets, match_id, session, money) {
    ajaxStart();
    var iterations = 0; //кол-во итераций (счетчик массива для ссылок)
    var Array = []; //массив матчей
    var ArrayNames1 = [];
    var ArrayNames2 = [];
    var i = 0; //счетчик для for-а, анализирующего матчи
    var j = 0; //счетчик для For-a, который смотрит рейтинг команд
    var q = 0; //
    var gamesNum = 0;
    var error = false; //Проверяет поймали ли мы ошибку в исключениях
    var serverReturn = ''; // url присланный с сервера
    var firstHeadToHead = 0; //1-ый коэффицент алгоритма, показывающий прошлые игры команд
    var thirdMapStats = 0; // 3-ий коэф алгоритма, показывающий разницу в силах на отделных картах
    var PastMatchesMass = [];
    var secondValue = 0;
    var secondPastMatches1 = 0; //2-ой коэффициент алгоримта для 1 команды, показывающий разницу между командами в их прошлых играх с другими командами
    var secondPastMatches2 = 0; //2-ой коэффициент алгоримта для 2 команды, показывающий разницу между командами в их прошлых играх с другими командами
    var gamesArray1 = []; //Массив, содержащий ссылки на команд, игравшие с 1 командой (нужен, чтобы находить 2 коэффицент)
    var gamesArray2 = []; //Массив, содержащий ссылки на команд, игравшие с 2 командой (нужен, чтобы находить 2 коэффицент)
    var scoreMass1 = []; // Массив, содержащий результаты матчей, игравшие с 1 командой (нужен, чтобы находить 2 коэффицент)
    var scoreMass2 = []; // Массив, содержащий результаты матчей, игравшие с 1 командой (нужен, чтобы находить 2 коэффицент)
    var gamesValue1 = 0; //сумма матчей, сыгранных с другими командами.
    var gamesValue2 = 0;
    var consilienceIndex = null;
    var winningKoef1 = 1.3;
    var winningKoef2 = 1.3;
    var firstNameBets = String(firstNameFromBets);
    var secondNameFronBets = String(secondNameFronBets);

    firstNameBets = firstNameBets.toLowerCase();
    secondNameFronBets = secondNameFronBets.toLowerCase();

    if (firstNameFromBets == 'sj gaming') firstNameFromBets = 'sj';
    if (secondNameFronBets == 'sj gaming') secondNameFronBets = 'sj';

    var firstNameRegEx = new RegExp(firstNameBets);
    var secondNameRegEx = new RegExp(secondNameFronBets);

    /*if(firstNameFromBets == 'BOOT-dS') firstNameFromBets = 'BOOT-d[S]';
		if(secondNameFronBets == 'BOOT-dS') secondNameFronBets = 'BOOT-d[S]';*/
    /*if(firstNameFromBets == 'Vega') firstNameFromBets = 'Vega squadron';
		if(secondNameFronBets == 'Vega') secondNameFronBets = 'Vega squadron';
    if(firstNameFromBets == 'Team Reapers') firstNameFromBets = 'reapers';
		if(secondNameFronBets == 'Team Reapers') secondNameFronBets = 'reapers';

    var transferredNames = firstNameFromBets + ' vs ' + secondNameFronBets;
		transferredNames = transferredNames.toLowerCase();*/

    request = new XMLHttpRequest(); //запрос к серверу, который отправляет данные о матче
    var requestBody = ''; //строка для отправки на сервер
    var matchStats = {}; //структура, описывающая все аспекты матча (имя команд, все коэффициенты и время начала матча)

    finalRequest = new XMLHttpRequest();

    document.getElementById("logs").innerHTML += "<p> Заходим на сайт hltv и пытаемся найти матч" + firstNameFromBets + " vs " + secondNameFronBets + "Время: " + logsDate;;
    //Заходим на страну со списком матчей и заносим в массив все ссылки
    try {
      $.ajax('https://www.hltv.org/matches/').done(function(data) {
        $(data).find('.match-day a').each(function() {
          var name = this.innerText; //название матча
          Array[iterations] = 'https://www.hltv.org' + $(this).attr('href'); //ссылка на матч
          console.log((iterations + 1) + ' ' + 'ссылка' + ' ' + Array[iterations]);
          iterations++;
        })
        console.log('iterations = ' + iterations + ' i = ' + i);
        console.log('Переданы имена команд - ' + firstNameBets + ' vs ' + secondNameFronBets);
        for (i = 0; i < iterations; i++) {
          try {
            ArrayNames1[i] = $(data).find('.match-day .table .team')[2 * i].innerText;
            ArrayNames1[i] = ArrayNames1[i].toLowerCase();
            ArrayNames2[i] = $(data).find('.match-day .table .team')[(2 * i) + 1].innerText;
            ArrayNames2[i] = ArrayNames2[i].toLowerCase();
          } catch (e) {
            ArrayNames1[i] = '';
            ArrayNames2[i] = '';
          }
          if ((firstNameRegEx.exec(ArrayNames1[i]) != null) && (secondNameRegEx.exec(ArrayNames2[i]) != null)) {
            consilienceIndex = i;
            i = iterations;
          }
          console.log(" Найдены совпадения по regExp? - " + ((firstNameRegEx.exec(ArrayNames1[i]) != null) && (secondNameRegEx.exec(ArrayNames2[i]) != null)));
        }
        console.log(consilienceIndex);
        //За один проход берем со всех матчей статистику по командам
        console.log('я зашел в ' + consilienceIndex + ' матч ');
        if (consilienceIndex != null) {
          document.getElementById("logs").innerHTML += "<p> Матч найден. Берем информацию."
        } else {
          document.getElementById("logs").innerHTML += "<p> Матч не найден. Ставку поставить невозможно"
        }
        //Если совпадений не найдено, снова запускаем бота через 5 минут
        /*if(consilienceIndex == null)
        {
          console.log('Нет совпадений');
            setTimeout(function() {
            ChooseBetsCSGO();
          }, 3000000);
          //return 0;
        }*/
        /*1 ajax запрос - вычисляем 1 коэффицент, head-to-head*/
        $.ajax(Array[consilienceIndex]).done(function(data) {
          gamesNum = FindGamesLength(data);

          matchStats.teamsName = SearchNames(data);
          console.log(matchStats.teamsName);

          firstHeadToHead = HeadToHead(data);
          console.log('мне передался из функции 1 коэффицент = ' + firstHeadToHead);

          winningKoef1 = SearchWinKoef(data, 0);
          winningKoef2 = SearchWinKoef(data, 2);
          console.log(winningKoef1 + ' ' + winningKoef2);

          /*Вычисляем 2 коэффициент. Находим кол-во прошлых игр у 1 и 2 команды по отдельности,
          заходим по ссылке на страницу команды, с которыми играли и вытаскиваем их место в рейтинге*/
          gamesValue1 = PastMatches(data, 1);
          console.log('gamesValue1 = ' + gamesValue1);
          gamesValue2 = PastMatches(data, 2);
          console.log('gamesValue2 = ' + gamesValue2);
          for (j = 0; j < gamesValue1; j++) {
            gamesArray1[j] = PastMatchesAnalize(data, j);
            scoreMass1[j] = MatchScore(data, j);
          }
          for (j = gamesValue1; j < (gamesValue1 + gamesValue2); j++) {
            gamesArray2[j] = PastMatchesAnalize(data, j);
            scoreMass2[j] = MatchScore(data, j);
          }
          for (j = 0; j < gamesValue1; j++) {
            $.ajax({
              url: gamesArray1[j],
              async: false
            }).done(function(data) {
              PastMatchesMass[j] = FindRating(data);
              console.log('Рейтинг ' + (j + 1) + ' команды (для 1 команды) ' + PastMatchesMass[j]);
              secondPastMatches1 += CalculateRating(PastMatchesMass[j], scoreMass1[j]);
            })
          };
          for (j = gamesValue1; j < (gamesValue2 + gamesValue1); j++) {
            $.ajax({
              url: gamesArray2[j],
              async: false
            }).done(function(data) {
              PastMatchesMass[j] = FindRating(data);
              console.log('Рейтинг ' + (j + 1 - gamesValue1) + ' команды (для 2 команды) ' + PastMatchesMass[j]);
              secondPastMatches2 += CalculateRating(PastMatchesMass[j], scoreMass2[j]);
            })
          };
          secondValue = secondPastMatches1 - secondPastMatches2;
          console.log('2-ой коэффицент = ' + secondValue);
          thirdMapStats = MapStats(data);
          console.log('мне передался из функции 3 коэффицент = ' + thirdMapStats);
          q++;

          document.getElementById("logs").innerHTML += "<p>Информация собрана. Отправляем заявку на сервер. Время: " + logsDate;
          document.getElementById("logs").innerHTML += "name=" + matchStats.teamsName + " firstValue=" + firstHeadToHead + " secondValue=" + secondValue + " thirdValue=" + thirdMapStats + " &money=" + money + "&1winkoef=" + winningKoef1 + "&2winkoef=" + winningKoef2 + " gamesNum=" + gamesNum + "&multiplikator=" + window.multiplicator;
          requestBody = "name=" + matchStats.teamsName + "&firstValue=" + firstHeadToHead + "&secondValue=" + secondValue + "&thirdValue=" + thirdMapStats + "&matchID=" + match_id + "&SessionToken=" + session + "&money=" + money + "&1winkoef=" + winningKoef1 + "&2winkoef=" + winningKoef2 + "&gamesNum=" + gamesNum + "&multiplikator=" + window.multiplicator;
          console.log("http://money-button.ru.com/postdata.php?" + requestBody);
          request.open("GET", "http://money-button.ru.com/postdata.php?" + requestBody, false);
          request.send();
          request.onreadystatechange = reqReadyStateChange(match_id);
          //return 0;
          //ChooseBetsCSGO();
        });
      });
    } catch (e) {
      setTimeout(function() {
        ChooseBetsCSGO();
      }, 3000000);
    }
  }

  function FinishRequestToBetService(checkID) {
    if (finalRequest.readyState == 4) {
      var status = finalRequest.status;
      if (status == 200) {
        document.getElementById("logs").innerHTML += "<p>Бот закончил работу со ставкой, начинаем новую. Время: " + logsDate;
        console.log('Бот закончил работу со ставкой, начинаем новую с id ' + checkID);
        ChooseBetsCSGO(checkID)
      }
    }
  }

  ///////////////////////////////////////////////////////////////////
  //Функция для парсинга данных с betscsgo.com
  //и составления ссылки-запроса, по которой делается ставка
  ///////////////////////////////////////////////////////////////////
  function ChooseBetsCSGO(checkID) {
    var SessionToken = ''; //Токен сессии. Нужен для индентификации пользователя
    var i = 0; //используется в while (26 строка)
    var g = 0;
    var moneyRegEx = /\d+.\d+(?=<\/span><\/a>)/g;
    var money = 0; //Кол-во денег на сайте
    var firstMatchFlag = 50;
    /////////////////////////////////////////////////////////////////
    //Переменные для определения ID матча
    ////////////////////////////////////////////////////////////////
    var matchIdRegEx = /\d+(?=","m_time)/g; //Ищет id матча
    var ArrayWithMatchID = []; //массив для промежуточного хранения id матчей (именно массив, потому что регулярное выражение возвращает массив)
    var matchID = []; //массив для сохранения всех id матчей
    var matchIDLength = 0;
    /////////////////////////////////////////////////////////////////
    //Переменные для определения времени
    ////////////////////////////////////////////////////////////////
    var currentDate = Math.round(Number(new Date().getTime()) / 1000);
    var matchTimeRegEx = /\d+(?=","m_score)/g;
    var ArrayWithTime = []; //массив для промежуточного хранения времени начала матчей (именно массив, потому что регулярное выражение возвращает массив)
    var matchTime = []; //массив для сохранения всего времени начала матчей
    var matchTimeLength = 0; //длина массива с временем начала матчей
    var nearestMatch = 0; //индекс матча, который стартует менее чем за 10 минут
    var nearestMatchTime = 0; //Время до начала ближайшего матча
    ////////////////////////////////////////////////////////////////
    //Переменные для определения коэффицинта выигрыша (Данные не всегда можно получить достоверно)
    ///////////////////////////////////////////////////////////////
    /*var firstTeamMoneyRegEx = /"RUB":{"1":\d+,"2":\d+/g;
    var finalTeamMoneyRegEx = /\d+(?!":)/g;
    var fee_reduce_RegEx = /u_fee_reduce    = \d+/;
    var findNumRegEx = /\d+/;
    var u_fee_reduce = 0; //Комиссия сайта. Расчитывается по формуле
    var ArrayWithTeamMoney = [];
    var ArrayWith1TeamMoney = [];
    var ArrayWith2TeamMoney = [];
    var firstTeamMoney = [];*/
    ///////////////////////////////////////////////////////////////
    //Переменные для определения названия учавствующих команд
    ///////////////////////////////////////////////////////////////
    var rudeFirstNameRegEx = /"t1name":"[A-Za-z0-9!.-\s\[\]]+/g;
    var rudeSecondNameRegEx = /"t2name":"[A-Za-z0-9!.-\s\[\]]+/g;
    var finalNameRegEx = /[A-Za-z0-9.-\s\[\]]+(?!":")/g;
    var ArrayWithFirstNames = [];
    var ArrayWithSecondNames = [];
    var firstName = [];
    var secondName = [];
    var finalFirstName = [];
    var finalSecondName = [];
    var fixTime = 0;

    if (window.ownSessionToken != null) {
      document.getElementById("logs").innerHTML += "<p>Начинаем работу с сервисом betsCSGO."
      console.log(currentDate);
      $.ajax({
        url: 'https://betscsgo.com/',
        dataType: 'text'
      }).done(function(data) {
        document.getElementById("logs").innerHTML += "<p>Сайт успешно загружен. Получаем список игр (Снизу самые ближайшие). Время: " + logsDate;
        //alert('Загружен betscsgo');
        money = Number(moneyRegEx.exec(data));
        ArrayWithMatchID = matchIdRegEx.exec(data);
        ArrayWithTime = matchTimeRegEx.exec(data);
        //ArrayWithTeamMoney = firstTeamMoneyRegEx.exec(data);
        ArrayWithFirstNames = rudeFirstNameRegEx.exec(data);
        ArrayWithSecondNames = rudeSecondNameRegEx.exec(data);
        /*u_fee_reduce = String(fee_reduce_RegEx.exec(data));
        u_fee_reduce = Number(findNumRegEx.exec(u_fee_reduce));
        console.log(u_fee_reduce);*/

        //Пока находятся совпадения по регулярным выражениям, находим время каждого матча
        while ((ArrayWithTime = matchTimeRegEx.exec(data)) != null) {
          matchTime[i] = Number(ArrayWithTime[0]);
          i++;
        }

        //Находим ближайший матч на сайте, который начнется менее чем через 10 минут
        i = 0;
        do {
          nearestMatch = i + 1;
          i++;
        } while ((currentDate - matchTime[i]) < 300);

        //Из-за того что нам все равно с помощью регулярных выражений придется вытаскивать все совпадения по одному,
        //то мы в for-е перибераем все предстоящие матчи, чтобы выбрать последний
        //И создаем массив матчей с атрибутами: ID, поставленные деньги (рубли), имена команд
        i = 0;
        while (((ArrayWithMatchID = matchIdRegEx.exec(data)) != null) && ((ArrayWithFirstNames = rudeFirstNameRegEx.exec(data)) != null) && ((ArrayWithSecondNames = rudeSecondNameRegEx.exec(data)) != null) /* && ((ArrayWithTeamMoney = firstTeamMoneyRegEx.exec(data)) != null)*/ && (i < nearestMatch)) {
          matchID[i] = Number(ArrayWithMatchID[0]);
          firstName[i] = String(ArrayWithFirstNames[0]);
          secondName[i] = String(ArrayWithSecondNames[0]);
          while (finalNameRegEx.exec(firstName[i]) != null) {
            finalFirstName[i] = finalNameRegEx.exec(firstName[i]);
          }
          while (finalNameRegEx.exec(secondName[i]) != null) {
            finalSecondName[i] = finalNameRegEx.exec(secondName[i]);
          }
          //firstTeamMoney[i] = String(ArrayWithTeamMoney[0]);
          //Самый странный костыль. Без него информация неправильно обрабатывается
          /*while (finalTeamMoneyRegEx.exec(firstTeamMoney[i]) != null) {
          }
          ArrayWith1TeamMoney[i] = Number(finalTeamMoneyRegEx.exec(firstTeamMoney[i]));
          ArrayWith2TeamMoney[i] = Number(finalTeamMoneyRegEx.exec(firstTeamMoney[i]));*/
          console.log('1 Name - ' + finalFirstName[i] + ' 2 Name - ' + finalSecondName[i] + ' Match ID = ' + matchID[i] + ' Time = ' + matchTime[i] /* + ' Строка с деньгами ' + firstTeamMoney[i] + ' firstTeamMoney - ' + ArrayWith1TeamMoney[i] + ' secondTeamMoney - ' + ArrayWith2TeamMoney[i]*/ );
          //document.getElementById("logs").innerHTML += "<p>" + '1 Имя - ' + finalFirstName[i] + ' 2 Имя - ' + finalSecondName[i] + " Время начала = " + matchTime[i];
          i++;
        }

        i--;
        //firstMatchFlag = i;
        nearestMatchTime = matchTime[i] - currentDate;
        matchIDLength = matchID.length;
        console.log(data);
        console.log('кол-во матчей - ' + nearestMatch);
        $(data).find('.chat-settings__nick-change input').each(function() {
          SessionToken = $(this).attr('data-session');
          console.log(SessionToken + ' money ' + money);
        })
        //Временно для отладки
        //nearestMatchTime = 0;

        if ((nearestMatchTime * 1000 - 600000) < 0) nearestMatchTime = 300;
        if (checkID != null) {
          console.log('Попытка повторной ставки. Пресечено');
        } else {
          document.getElementById("logs").innerHTML += "<p>Бот сделает ставку через " + (nearestMatchTime - 300) + ' cек на матч ' + finalFirstName[i] + ' vs ' + finalSecondName[i] + "Время: " + logsDate;
          console.log('Бот сделает ставку через ' + (nearestMatchTime - 300) + ' cек на матч ' + finalFirstName[i] + ' vs ' + finalSecondName[i]);
          if ((finalFirstName[i] != "TBD") && (finalSecondName[i] != "TBD")) {
            if (window.hotfixMatchID == matchID[i]) fixTime = 600000;
            window.hotfixMatchID = matchID[i];
            setTimeout(function() {
              parserHLTV(finalFirstName[i], finalSecondName[i], matchID[i], SessionToken, money);
            }, (nearestMatchTime * 1000 - 600000 + fixTime));
            /*setTimeout(function() {
              parserHLTV(finalFirstName[i], finalSecondName[i], matchID[i], SessionToken, money);
            }, 0);*/
            //alert("Ky");
          } else {
            document.getElementById("logs").innerHTML += "<p>Команды не известны. Новый цикл начнется через " + (matchTime[i] - currentDate - 300) + " cек. Время: " + logsDate;
            console.log('Новый цикл начнется через ' + (matchTime[i] - currentDate + 300) + " cек");
            setTimeout(function() {
              ChooseBetsCSGO(null);
            }, ((matchTime[i] - currentDate + 300) * 1000));
          }

        }

        for (var j = i; j > 0; j--) {
          console.log('checkID = ' + checkID + ' matchID[j] = ' + matchID[j] + ' matchTime[j] = ' + matchTime[j] + ' matchTime[j-1] = ' + matchTime[j - 1]);
          if ((checkID == matchID[j]) && (matchTime[j] == matchTime[j - 1]) && (checkID != null)) {
            //window.hotfixMatchID[i - j] = matchID[j - 1];
            firstMatchFlag = j;
            document.getElementById("logs").innerHTML += "<p>Найден матч с таким же временем - " + finalFirstName[j - 1] + ' vs ' + finalSecondName[j - 1] + "Время: " + logsDate;
            console.log('Найден матч с таким же временем - ' + finalFirstName[j - 1] + ' vs ' + finalSecondName[j - 1]);
            /*if ((nearestMatchTime * 1000 - 600000) < 0) nearestMatchTime = 300;
            console.log('Бот сделает ставку через ' + (nearestMatchTime - 300) + ' cек');
            setTimeout(function() {
              parserHLTV(finalFirstName[j-1], finalSecondName[j-1], matchID[j-1], SessionToken, money);
            }, (nearestMatchTime * 1000 - 600000));*/
            j = 0;
          }
        }

        //nearestMatchTime = 500;
        if ((checkID == matchID[firstMatchFlag]) && (matchTime[firstMatchFlag] == matchTime[firstMatchFlag - 1]) && (checkID != null)) {
          if ((nearestMatchTime * 1000 - 600000) < 0) nearestMatchTime = 300;
          document.getElementById("logs").innerHTML += "<p>Бот сделает ставку через " + (nearestMatchTime - 300) + ' cек. Время: ' + logsDate;
          console.log('Бот сделает ставку через ' + (nearestMatchTime - 300) + ' cек');
          setTimeout(function() {
            parserHLTV(finalFirstName[firstMatchFlag - 1], finalSecondName[firstMatchFlag - 1], matchID[firstMatchFlag - 1], SessionToken, money);
          }, (nearestMatchTime * 1000 - 600000));
        }

        //if(firstMatchFlag == 50) firstMatchFlag = i - 1;
        console.log('Начать заново? - ' + ((checkID != null) && (checkID != matchID[i - 1])) + checkID + ' ' + matchID[i - 1]);
        if ((checkID != null) && (firstMatchFlag == 50)) {
          firstMatchFlag = i - 1;
          if ((matchTime[firstMatchFlag] - currentDate - 300) < 0) matchTime[firstMatchFlag] = currentDate + 300;
          document.getElementById("logs").innerHTML += "<p>Новый цикл начнется через " + (matchTime[firstMatchFlag] - currentDate - 300) + " cек. Время: " + logsDate;
          console.log('Новый цикл начнется через ' + (matchTime[firstMatchFlag] - currentDate - 300) + " cек");
          setTimeout(function() {
            ChooseBetsCSGO(null);
          }, ((matchTime[firstMatchFlag] - currentDate - 300) * 1000));
        }
        /*while(matchTime[i] == matchTime[i-1])
        {
          i--;
          console.log('Найден матч с таким же временем - ' + finalFirstName[i] + ' vs ' + finalSecondName[i]);
          if ((nearestMatchTime * 1000 - 600000) < 0) nearestMatchTime = 300;
          console.log('Бот сделает ставку через ' + (nearestMatchTime - 300) + ' cек');
          setTimeout(function() {
            parserHLTV(finalFirstName[i], finalSecondName[i], matchID[i], SessionToken, money);
          }, (nearestMatchTime * 1000 - 600000 - (i * 5000)));
        }*/

        /*if(((matchTime[i-1] - currentDate - 300) * 1000) < 0) {
          ChooseBetsCSGO();
        }
        else {
          console.log('Запустить функцию снова через ' + ((matchTime[i-1] - currentDate - 300) * 1000));
          setTimeout(function() { ChooseBetsCSGO(); }, ((matchTime[i-1] - currentDate - 300) * 1000));
        }*/
        //alert('stop');
      });
    } else {
      document.getElementById("logs").innerHTML += " <p>Что-то пошло не так. Нажмите кнопку 'Войти' и выполните вход в систему через Steam. Время: " + logsDate;
      alert("Войдите в систему через Steam, пожалуйста");
    }
  }

  /*function ChooseParimatch(){
  	alert('Wow it s parimatch');}*/

  ///////////////////////////////////////////////////////////////////////
  //Парсер csgoPozitive. Пока не актуален
  ///////////////////////////////////////////////////////////////////////
  function ChooseCSGOpositive() {
    $.ajax('https://csgopositive.com/').done(function(data) {
      console.log(data);
    });
  }

  function ChooseLootBet() {
    $.ajax('https://lut.bet/sport/esports/counter-strike').done(function(data) {
      console.log(data);
    });
  }

  //Функция, которая запускает в новом окне авторизацию на сервере. Передаем туда собственный токен сессии
  function Authorize() {
    window.ownSessionToken = GenerateSessionToken();
    console.log("http://money-button.ru.com/steamauth.php?login&setSessionToken=" + window.ownSessionToken);
    window.open("http://money-button.ru.com/steamauth.php?login&setSessionToken=" + window.ownSessionToken, '_blank').focus();
  }

  //Функция, генерирующая собственный токен сессии, чтобы по нему находить в таблице юзеров нужного на сервере
  function GenerateSessionToken() {
    var length = 15,
      charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  }

  //Функция, которая обновляет информацию о пользователе (его ставки)
  function UpdatePredictions(ownSessionToken) {

  }

  function BuyPredicts() {
    if (window.ownSessionToken != null) {
      window.open("http://money-button.ru.com/buy_predicts.php", '_blank').focus();
    } else {
      alert("Войдите в систему через Steam, пожалуйста");
    }
  }

  /* When the user clicks on the button,
toggle between hiding and showing the dropdown content */
  function DropDown() {
    document.getElementById("myDropdown").classList.toggle("show");
  }

  function openPage(pageName, elmnt, color) {
    // Hide all elements with class="tabcontent" by default */
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }

    // Remove the background color of all tablinks/buttons
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].style.backgroundColor = "";
    }

    // Show the specific tab content
    document.getElementById(pageName).style.display = "block";

    // Add the specific color to the button used to open the tab content
    elmnt.style.backgroundColor = color;
  }

  $(function() {
    /*--------Главное меню --------------*/
    $('#defaultOpen').click(function() {
      openPage('Home', this, 'green');
    });
    $('#tabLink2').click(function() {
      openPage('News', this, 'green');
    });
    $('#tabLink3').click(function() {
      openPage('Contact', this, 'green');
    });
    $('#tabLink4').click(function() {
      openPage('About', this, 'green');
    });
    // Get the element with id="defaultOpen" and click on it
    document.getElementById("defaultOpen").click();

    /*-----------------Слайдер мультипликатора---------------------*/
    var slider = document.getElementById("Multiplicator");
    var output = document.getElementById("Multiplicator-view");
    output.innerHTML = slider.value; // Display the default slider value
    window.multiplicator = slider.value;

    // Update the current slider value (each time you drag the slider handle)
    slider.oninput = function() {
      output.innerHTML = this.value;
    }

    // Close the dropdown menu if the user clicks outside of it
    window.onclick = function(event) {
      if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
          var openDropdown = dropdowns[i];
          if (openDropdown.classList.contains('show')) {
            openDropdown.classList.remove('show');
          }
        }
      }
    }

    /*----------Выпадающий список сервисов для ставок------------*/
    var drop_down = document.getElementById("myDropdown");
    var output_dropdown = document.getElementById("Bet-service-view");

    drop_down.oninput = function() {
      output_dropdown.innerHTML = this.value;
    }
    /*var betsCSGO = document.getElementById("betscsgo");
    var parimatch = document.getElementById("parimatch");
    var csgopositive = document.getElementById("csgopositive.com");
    if(betsCSGO.checked){$('#chooseBetService').click(ChooseBetsCSGO);}
    if(parimatch.checked){$('#chooseBetService').click(ChooseParimatch);}
    if(csgopositive.checked){$('#chooseBetService').click(ChooseCSGOpositive);}*/
    //alert("Выберите сервис для ставок");
    $('#startBetsCSGO').click(function() {
      ChooseBetsCSGO(null);
    });
    $('#DropDown').click(DropDown);
    $('#startPozitive').click(ChooseCSGOpositive);
    $('#startLootBet').click(ChooseLootBet);
    $('#SteamAuth').click(Authorize);
    $('#BuyPredicts').click(BuyPredicts);
  });
})(jQuery);
