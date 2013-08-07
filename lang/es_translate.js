var translation_map = {
  "no letters were placed.":
  "sin letras fueron colocadas.",

  "word must be horizontal or vertical.":
  "la palabra tiene que ser horizontal o vertical.",

  "first word must be on the star.":
  "primera palabra debe estar en la estrella.",

  " is not connected to a word.":
  " no está conectado a una palabra.",

  "spaces in word.":
  "espacios de palabra.",

  " not found in dictionary.":
  " no encontrado en el diccionario." ,

  "Sorry - no tiles left to swap":
  "Lo siento - no hay baldosas de izquierda a cambiar",

  "I pass, your turn.":
  "Yo paso, tu turno.",

  "After deducting points of unplaced tiles, score is:":
  "Después de deducir los puntos de baldosas sin colocar, el resultado es:" ,

  " Computer:":
  " Computer:",

  "It's a draw!":
  "Es un empate!",

  "Computer wins.":
  "Computer gana.",

  "You win!":
  "Tú ganas!",

  "Sorry, ":
  "Lo siento, " ,

  "Computer thinking, please wait ...":
  "El pensamiento computadora, por favor espere ...",

  "OK":
  "OK",

  "Computer last score:":
  "Última puntuación Computer:",

  "Computer total score:":
  "Computer puntuación total:",

  "Your last score:":
  "Su última puntuación:",

  "Your total score:":
  "Su puntuación total:",

  "Tiles left:":
  "Azulejos izquierda:",

  "Play":
  "Jugar",

  "Pass":
  "Pasar",

  "Clear":
  "Limplar",

  "Swap":
  "Canjear",

  "Words played:":
  "palabras jugado",

  "Playing at level:":
  "Jugar en el nivel:",

  "Show computer's rack":
  "Mostrar bastidor del ordenador",

  "Hide computer's rack":
  "Ocultar bastidor del ordenador"
}

function t( str )
{
    if (!(str in translation_map) )
      return str;

    return translation_map[ str ];
}

