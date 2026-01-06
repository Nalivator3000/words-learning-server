/**
 * Script to add themes to Spanish words in source_words_spanish table
 * Uses keyword matching to categorize words into themes
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

// Тематические категории с ключевыми словами для поиска
const THEME_KEYWORDS = {
  // A1-A2 Темы
  'family': ['familia', 'padre', 'madre', 'hijo', 'hija', 'hermano', 'hermana', 'abuelo', 'abuela', 'tío', 'tía', 'primo', 'prima', 'esposo', 'esposa', 'marido', 'mujer', 'papá', 'mamá', 'bebé', 'niño', 'niña', 'pariente'],

  'food': ['comida', 'comer', 'beber', 'agua', 'café', 'té', 'leche', 'pan', 'carne', 'pollo', 'pescado', 'arroz', 'pasta', 'fruta', 'verdura', 'manzana', 'naranja', 'plátano', 'tomate', 'cerveza', 'vino', 'restaurante', 'camarero', 'menú', 'plato', 'desayuno', 'almuerzo', 'cena', 'cocina', 'cocinar', 'receta', 'delicioso', 'rico', 'hambre', 'sed', 'ensalada', 'sopa', 'postre', 'dulce', 'salado', 'picante'],

  'travel': ['viaje', 'viajar', 'avión', 'tren', 'autobús', 'taxi', 'coche', 'bicicleta', 'moto', 'camión', 'estación', 'aeropuerto', 'hotel', 'hostal', 'billete', 'ticket', 'maleta', 'equipaje', 'pasaporte', 'visa', 'frontera', 'turista', 'guía', 'mapa', 'dirección', 'calle', 'avenida', 'plaza'],

  'work': ['trabajo', 'trabajar', 'empleo', 'empleado', 'empleador', 'oficina', 'empresa', 'negocio', 'jefe', 'colega', 'compañero', 'sueldo', 'salario', 'dinero', 'pagar', 'cobrar', 'contrato', 'reunión', 'proyecto', 'cliente', 'producto', 'servicio', 'venta', 'compra', 'profesión', 'carrera'],

  'education': ['escuela', 'colegio', 'universidad', 'instituto', 'profesor', 'maestro', 'estudiante', 'alumno', 'clase', 'curso', 'examen', 'prueba', 'nota', 'calificación', 'libro', 'cuaderno', 'lápiz', 'pluma', 'bolígrafo', 'estudiar', 'aprender', 'enseñar', 'lectura', 'escritura', 'matemáticas', 'historia', 'ciencia', 'idioma', 'lengua'],

  'health': ['salud', 'saludable', 'enfermo', 'enfermedad', 'dolor', 'médico', 'doctor', 'hospital', 'clínica', 'medicina', 'medicamento', 'pastilla', 'tratamiento', 'curar', 'paciente', 'síntoma', 'fiebre', 'tos', 'resfriado', 'gripe', 'cabeza', 'estómago', 'corazón', 'sangre', 'hueso', 'músculo', 'piel', 'cuerpo', 'brazo', 'pierna', 'mano', 'pie', 'ojo', 'oreja', 'nariz', 'boca', 'diente'],

  'home': ['casa', 'hogar', 'apartamento', 'piso', 'habitación', 'dormitorio', 'sala', 'cocina', 'baño', 'jardín', 'garaje', 'puerta', 'ventana', 'pared', 'techo', 'suelo', 'escalera', 'mesa', 'silla', 'cama', 'sofá', 'armario', 'estante', 'lámpara', 'espejo', 'alfombra', 'cortina', 'mueble', 'llave'],

  'nature': ['naturaleza', 'animal', 'perro', 'gato', 'pájaro', 'pez', 'caballo', 'vaca', 'cerdo', 'gallina', 'árbol', 'flor', 'planta', 'rosa', 'hierba', 'bosque', 'selva', 'montaña', 'colina', 'valle', 'río', 'lago', 'mar', 'océano', 'playa', 'isla', 'desierto', 'campo', 'cielo', 'sol', 'luna', 'estrella', 'tierra', 'piedra', 'arena'],

  'weather': ['tiempo', 'clima', 'sol', 'lluvia', 'nube', 'viento', 'nieve', 'tormenta', 'trueno', 'relámpago', 'niebla', 'frío', 'calor', 'temperatura', 'grado', 'estación', 'primavera', 'verano', 'otoño', 'invierno'],

  'communication': ['hablar', 'decir', 'contar', 'explicar', 'preguntar', 'responder', 'contestar', 'escuchar', 'oír', 'ver', 'mirar', 'leer', 'escribir', 'teléfono', 'móvil', 'celular', 'llamar', 'llamada', 'mensaje', 'texto', 'correo', 'email', 'carta', 'internet', 'web', 'página', 'sitio', 'ordenador', 'computadora', 'teclado', 'ratón', 'pantalla'],

  'culture': ['cultura', 'arte', 'música', 'cantar', 'canción', 'bailar', 'baile', 'tocar', 'instrumento', 'piano', 'guitarra', 'pintura', 'pintar', 'dibujo', 'dibujar', 'museo', 'galería', 'teatro', 'cine', 'película', 'actor', 'actriz', 'director', 'espectáculo', 'concierto', 'festival', 'exposición'],

  'sports': ['deporte', 'deportivo', 'fútbol', 'baloncesto', 'tenis', 'voleibol', 'natación', 'nadar', 'correr', 'carrera', 'ciclismo', 'bicicleta', 'jugar', 'jugador', 'equipo', 'partido', 'ganar', 'perder', 'empatar', 'gol', 'pelota', 'balón', 'cancha', 'campo', 'estadio', 'gimnasio', 'entrenar', 'entrenamiento'],

  // B1-B2 Темы
  'emotions': ['emoción', 'sentir', 'sentimiento', 'feliz', 'felicidad', 'alegre', 'alegría', 'contento', 'triste', 'tristeza', 'enojado', 'enfadado', 'enojo', 'miedo', 'temer', 'preocupar', 'preocupación', 'nervioso', 'nervio', 'tranquilo', 'calma', 'sorpresa', 'sorprender', 'amor', 'amar', 'querer', 'odio', 'odiar', 'esperar', 'esperanza', 'desesperación'],

  'politics': ['política', 'político', 'gobierno', 'gobernar', 'presidente', 'ministro', 'diputado', 'senador', 'parlamento', 'congreso', 'ley', 'legal', 'ilegal', 'derecho', 'deber', 'elección', 'elegir', 'votar', 'voto', 'partido', 'democracia', 'dictadura', 'libertad', 'igualdad', 'justicia', 'ciudadano', 'constitución'],

  'economics': ['economía', 'económico', 'dinero', 'banco', 'cuenta', 'ahorrar', 'ahorro', 'gastar', 'gasto', 'precio', 'valor', 'caro', 'barato', 'comprar', 'vender', 'mercado', 'comercio', 'negocio', 'empresa', 'industria', 'producir', 'producción', 'producto', 'consumir', 'consumidor', 'inversión', 'invertir', 'préstamo', 'deuda', 'impuesto', 'inflación', 'crisis'],

  'technology': ['tecnología', 'técnico', 'digital', 'electrónico', 'internet', 'red', 'conexión', 'conectar', 'desconectar', 'wifi', 'cable', 'ordenador', 'computadora', 'portátil', 'tableta', 'móvil', 'celular', 'smartphone', 'aplicación', 'app', 'programa', 'software', 'hardware', 'sistema', 'archivo', 'carpeta', 'documento', 'datos', 'información', 'descargar', 'subir', 'guardar', 'borrar', 'eliminar'],

  'environment': ['medio ambiente', 'ambiental', 'ecología', 'ecológico', 'contaminar', 'contaminación', 'reciclar', 'reciclaje', 'basura', 'residuo', 'energía', 'renovable', 'solar', 'eólico', 'sostenible', 'sustentable', 'planeta', 'tierra', 'clima', 'cambio climático', 'calentamiento', 'emisión', 'carbono', 'oxígeno'],

  // C1-C2 Темы
  'science': ['ciencia', 'científico', 'investigación', 'investigar', 'experimento', 'experimental', 'laboratorio', 'hipótesis', 'teoría', 'método', 'análisis', 'analizar', 'resultado', 'conclusión', 'descubrimiento', 'descubrir', 'física', 'química', 'biología', 'matemáticas', 'fórmula', 'ecuación', 'átomo', 'molécula', 'célula', 'gen', 'genética'],

  'law': ['ley', 'legal', 'ilegal', 'derecho', 'abogado', 'juez', 'tribunal', 'corte', 'juicio', 'proceso', 'caso', 'sentencia', 'condena', 'pena', 'multa', 'delito', 'crimen', 'criminal', 'culpable', 'inocente', 'testigo', 'evidencia', 'prueba', 'acusar', 'defender', 'justicia', 'injusticia'],

  'philosophy': ['filosofía', 'filosófico', 'filósofo', 'ética', 'moral', 'valor', 'virtud', 'bien', 'mal', 'verdad', 'mentira', 'realidad', 'existencia', 'esencia', 'razón', 'razonar', 'lógica', 'argumento', 'premisa', 'conclusión', 'metafísica', 'epistemología'],

  'psychology': ['psicología', 'psicológico', 'psicólogo', 'mente', 'mental', 'cerebro', 'pensamiento', 'pensar', 'idea', 'concepto', 'memoria', 'recordar', 'olvidar', 'atención', 'concentración', 'percepción', 'comportamiento', 'conducta', 'personalidad', 'carácter', 'actitud', 'motivación', 'emoción', 'inconsciente', 'consciente']
};

async function addThemesToWords() {
  try {
    console.log('\n🎨 === ДОБАВЛЕНИЕ ТЕМ К ИСПАНСКИМ СЛОВАМ ===\n');

    let totalUpdated = 0;

    for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
      console.log(`\n🏷️  Обработка темы: ${theme}`);
      console.log(`   Ключевых слов: ${keywords.length}`);

      // Обновляем слова, которые содержат ключевые слова этой темы
      const likeConditions = keywords.map((_, i) => `LOWER(word) LIKE $${i + 1}`).join(' OR ');

      const result = await pool.query(`
        UPDATE source_words_spanish
        SET theme = $${keywords.length + 1}
        WHERE theme IS NULL
        AND (${likeConditions})
      `, [...keywords.map(k => `%${k}%`), theme]);

      console.log(`   ✅ Обновлено слов: ${result.rowCount}`);
      totalUpdated += result.rowCount;
    }

    // Проверяем сколько слов осталось без темы
    const noTheme = await pool.query(`
      SELECT COUNT(*) as count
      FROM source_words_spanish
      WHERE theme IS NULL
    `);

    // Для оставшихся слов ставим тему 'general'
    const generalResult = await pool.query(`
      UPDATE source_words_spanish
      SET theme = 'general'
      WHERE theme IS NULL
    `);

    console.log('\n' + '═'.repeat(70));
    console.log(`\n📊 ИТОГО:`);
    console.log(`   Слов с темами: ${totalUpdated}`);
    console.log(`   Слов в категории 'general': ${generalResult.rowCount}`);
    console.log(`\n✅ Готово!\n`);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

addThemesToWords();
