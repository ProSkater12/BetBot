(function($) {

startInvasion();

//Инициализация. Добавляет интерфейс на csgopositive
function startInvasion(){
  //Если интерфейс уже есть, то ничего не добавляем
  if(checkInvasion()) return true;

  //Добавляем свой интерфейс
  $('#header').append(`
    <div id="betbot-hud" class="betbot-hud">
      <input type="button" value="Запустить бота" id="startBets"/>
    </div>
  `);
}

//Проверка на наличие интерфейса. Если он уже есть, то добавлять ничего не нужно
function checkInvasion(){
  let ourHud = document.getElementById('betbot-hud');
  if(ourHud) return true;
  return false;
}

/*КНОПКИ*/
$('#startBets').click(function(){
    let hltv = window.open('https://www.hltv.org/matches/');
    setTimeout(console.log(hltv), 5000);
    /*$.ajax({
      url: 'https://www.hltv.org/matches/',
      headers: {
        'Access-Control-Allow-Origin' : '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Version, Authorization, Content-Type'
      }
    }).done(function(data){
      console.log(data);
    });*/
});

})(jQuery);
