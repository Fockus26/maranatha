# D090 · Formularios · TimeField muestra "7:30 p. m." y no redondea minutos fuera de la grilla de 5 · Implementado

**Decisión:** el campo muestra la hora en 12 h con "a. m."/"p. m." (con espacio); un valor guardado como 19:07 se muestra "7:07 p. m." y la columna de minutos no marca ninguno hasta que se elija. Un campo vacío compone con 12 a. m. y minuto 0 como base.
**Por qué:** no cambiar en silencio un dato existente; la grilla de 5 solo limita lo que se elige, no lo que se muestra.
**Alternativa descartada:** redondear al múltiplo de 5 más cercano al abrir (altera datos sin que el usuario lo note).
