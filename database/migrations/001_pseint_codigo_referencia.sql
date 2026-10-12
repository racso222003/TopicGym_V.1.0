-- ============================================================================
--  TopicGym v1.0 · Migración 001
--  Estandarización de pseudocódigo a sintaxis oficial de PSeInt
-- ----------------------------------------------------------------------------
--  NO destructiva: solo actualiza columnas de contenido de la tabla `ejercicios`.
--  Conserva respuestas, progreso y logros de los estudiantes (no recrea tablas).
--
--  Aplicar (desde la raíz del proyecto):
--    psql -U postgres -d topicgym -f database/migrations/001_pseint_codigo_referencia.sql
--
--  Idempotente: puede ejecutarse varias veces sin efectos secundarios.
--  Nota: `orden` es global y único (1..15) en el banco piloto.
-- ============================================================================

BEGIN;

-- 1) Variables y tipos de datos
UPDATE ejercicios SET codigo_referencia = $pseint$Definir edad Como Entero
edad <- 17
Escribir edad + 1$pseint$ WHERE orden = 1;

-- 2) Conversión real a entero (truncamiento)
UPDATE ejercicios SET codigo_referencia = $pseint$Definir precio Como Real
precio <- 19.99
Escribir Trunc(precio)$pseint$ WHERE orden = 2;

-- 3) Conversión de texto a número
UPDATE ejercicios SET codigo_referencia = $pseint$Definir texto Como Cadena
Definir numero Como Entero
texto <- "6"
numero <- ConvertirANumero(texto)
Escribir numero + 4$pseint$ WHERE orden = 3;

-- 4) Operadores y precedencia
UPDATE ejercicios SET codigo_referencia = $pseint$Definir resultado Como Real
resultado <- 2 + 3 * 4 - 6 / 3
Escribir resultado$pseint$ WHERE orden = 4;

-- 5) Operador módulo (residuo)
UPDATE ejercicios SET codigo_referencia = $pseint$Definir resto Como Entero
resto <- 15 mod 4
Escribir resto$pseint$ WHERE orden = 5;

-- 6) Precedencia combinada con módulo
UPDATE ejercicios SET codigo_referencia = $pseint$Definir resultado Como Real
resultado <- 10 mod 3 * 2 + 8 / 4
Escribir resultado$pseint$ WHERE orden = 6;

-- 7) Condicional simple
UPDATE ejercicios SET codigo_referencia = $pseint$Si edad >= 18 Entonces
    Escribir "Mayor de edad"
SiNo
    Escribir "Menor de edad"
FinSi$pseint$ WHERE orden = 7;

-- 8) Condicionales: primera rama verdadera
UPDATE ejercicios SET codigo_referencia = $pseint$Si nota >= 4.0 Entonces
    Escribir "Aprobado"
SiNo
    Si nota >= 3.0 Entonces
        Escribir "Aprobado con seguimiento"
    SiNo
        Escribir "Reprobado"
    FinSi
FinSi$pseint$ WHERE orden = 8;

-- 9) Condición compuesta con operadores lógicos
UPDATE ejercicios SET codigo_referencia = $pseint$Definir nota Como Real
nota <- 4.1
Si nota >= 0 Y nota <= 5 Y nota >= 4.0 Entonces
    Escribir "Excelente"
SiNo
    Escribir "Rango inválido"
FinSi$pseint$ WHERE orden = 9;

-- 10) Ciclo para: suma de 1 a 3
UPDATE ejercicios SET codigo_referencia = $pseint$Definir suma, i Como Entero
suma <- 0
Para i <- 1 Hasta 3 Con Paso 1 Hacer
    suma <- suma + i
FinPara
Escribir suma$pseint$ WHERE orden = 10;

-- 11) Ciclos: número de iteraciones
UPDATE ejercicios SET codigo_referencia = $pseint$Definir contador Como Entero
contador <- 0
Mientras contador < 5 Hacer
    Escribir contador
    contador <- contador + 2
FinMientras$pseint$ WHERE orden = 11;

-- 12) Ciclo con condición de corte
UPDATE ejercicios SET codigo_referencia = $pseint$Definir acumulado, veces Como Entero
acumulado <- 0
veces <- 0
Mientras acumulado < 10 Hacer
    acumulado <- acumulado + 4
    veces <- veces + 1
FinMientras$pseint$ WHERE orden = 12;

-- 13) Contar pares en un arreglo
UPDATE ejercicios SET codigo_referencia = $pseint$Definir numeros Como Entero
Dimension numeros[4]
numeros[1] <- 3
numeros[2] <- 8
numeros[3] <- 5
numeros[4] <- 2
Definir cuantos Como Entero
cuantos <- 0
Para Cada n De numeros Hacer
    Si n mod 2 = 0 Entonces
        cuantos <- cuantos + 1
    FinSi
FinPara
Escribir cuantos$pseint$ WHERE orden = 13;

-- 14) Actualizar un elemento del arreglo (adaptado a indexado 1 de PSeInt)
UPDATE ejercicios
   SET codigo_referencia = $pseint$Definir numeros Como Entero
Dimension numeros[3]
numeros[1] <- 10
numeros[2] <- 20
numeros[3] <- 30
numeros[2] <- numeros[2] * 2
Escribir numeros[2]$pseint$,
       enunciado   = '¿Cuál es el valor final en la segunda posición del arreglo?',
       explicacion = 'Se duplica el valor de la segunda posición del arreglo: 20 * 2 = 40.',
       pista       = 'En PSeInt el primer elemento del arreglo ocupa la posición 1.'
 WHERE orden = 14;

-- 15) Arreglos y acumulador
UPDATE ejercicios SET codigo_referencia = $pseint$Definir numeros Como Entero
Dimension numeros[4]
numeros[1] <- 4
numeros[2] <- 8
numeros[3] <- 1
numeros[4] <- 6
Definir suma, n Como Entero
suma <- 0
Para Cada n De numeros Hacer
    suma <- suma + n
FinPara
Escribir suma$pseint$ WHERE orden = 15;

COMMIT;
