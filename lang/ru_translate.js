var translation_map = {
  "no letters were placed.":
  "вы не сделали ход.",

  "word must be horizontal or vertical.":
  "распложите слова по горизонтали или по вертикали.",

  "first word must be on the star.":
  "Первое слово должно быть на звезде",

  " is not connected to a word.":
  " не подключен к слову.",

  "spaces in word.":
  "пробелов в слове",

  " not found in dictionary.":
  " отсутствует в словаре." ,

  "Sorry - no tiles left to swap":
  "К сожалению у вас не осталось букв для обмена",

  "I pass, your turn.":
  "У меня нет ходов, ваша  очередь",

  "After deducting points of unplaced tiles, score is:":
  "Ваш балл после вычета оставшихся букв" ,

  "  Computer:":
  " компьютер:",

  "It's a draw!":
  "Это ничья!",

  "Computer wins.":
  "Компьютер выигрывает.",

  "You win!":
  "Вы выиграли!",

  "Sorry, ":
  "Извините, " ,

  "Computer thinking, please wait ...":
  "Компьютер думает, подождите пожалуйста ...",

  "OK":
  "Ладно",

  "Computer last score:":
  "Последний балл компьютера:",

  "Computer total score:":
  "Общий балл компьютера:",

  "Your last score:":
  "Ваш последний балл:",

  "Your total score:":
  "Ваш общий балл:",

  "Tiles left:":
  "Осталось букв:",

  "Play":
  "Играть",

  "Pass":
  "Пас",

  "Clear":
  "Очистить",

  "Swap":
  "Обмен",

  "Words played:":
  "Сыгранные слова",

  "Show computer's rack":
  "Показать расклад компьютера",

  "Playing at level:":
  "Играть на уровне",

  "Hide computer's rack":
  "Скрыть расклад компьютера"
};

function t( str )
{
    if (!(str in translation_map) )
      return str;

    return translation_map[ str ];
}

