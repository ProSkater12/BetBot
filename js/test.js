QUnit.test("Тест CalculateRating(rating, string)", function( assert ){
  assert.ok(CalculateRating(100, '2 - 0') == 200, "Победа 1 команды со счетом 2 0");
  //equal(CalculateRating(100, '2 - 0'), 200, 'Победа 1 команды со счетом 2 0');
});
