(function($) {
  let siteUrl = 'http://bet-bot.ru.com/';
  init();

  //Функция инициализации
  function init() {
    //Отправка "hello" серверу
    sendHello();
  }

  //Отправка "hello" серверу, получение токена
  function sendHello() {
    let response = await fetch(siteUrl + 'hello');

    if (response.ok) { // если HTTP-статус в диапазоне 200-299
      // получаем тело ответа (см. про этот метод ниже)
      let json = await response.json();
    } else {
      alert("Ошибка HTTP: " + response.status);
    }
  }

})(jQuery);
