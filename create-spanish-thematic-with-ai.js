/**
 * Script to create REAL thematic word collections for Spanish using AI categorization
 * This will group words by actual themes like: Food, Travel, Business, Family, etc.
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

// Определяем темы для каждого уровня
const THEMES = {
  'A1': [
    { name: 'Greetings & Basics', keywords: ['hola', 'adiós', 'gracias', 'por favor', 'buenos', 'días', 'noches', 'tarde', 'bienvenido'] },
    { name: 'Numbers & Time', keywords: ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'hora', 'día', 'semana', 'mes', 'año', 'tiempo', 'minuto', 'segundo'] },
    { name: 'Family & People', keywords: ['familia', 'padre', 'madre', 'hijo', 'hija', 'hermano', 'hermana', 'abuelo', 'abuela', 'tío', 'tía', 'primo', 'gente', 'persona', 'hombre', 'mujer', 'niño', 'niña', 'bebé'] },
    { name: 'Food & Drinks', keywords: ['comida', 'comer', 'beber', 'agua', 'café', 'té', 'leche', 'pan', 'carne', 'pollo', 'pescado', 'arroz', 'fruta', 'verdura', 'manzana', 'naranja', 'plátano', 'tomate', 'cerveza', 'vino'] },
    { name: 'Home & Furniture', keywords: ['casa', 'hogar', 'habitación', 'cocina', 'baño', 'sala', 'dormitorio', 'cama', 'mesa', 'silla', 'puerta', 'ventana', 'pared', 'techo', 'suelo', 'mueble'] },
    { name: 'Colors & Descriptions', keywords: ['color', 'blanco', 'negro', 'rojo', 'azul', 'verde', 'amarillo', 'grande', 'pequeño', 'alto', 'bajo', 'largo', 'corto', 'nuevo', 'viejo', 'bueno', 'malo', 'bonito', 'feo'] },
    { name: 'Body & Health', keywords: ['cuerpo', 'cabeza', 'ojo', 'oreja', 'nariz', 'boca', 'mano', 'pie', 'brazo', 'pierna', 'salud', 'dolor', 'médico', 'hospital', 'enfermo'] },
    { name: 'Clothing', keywords: ['ropa', 'camisa', 'pantalón', 'vestido', 'falda', 'zapato', 'calcetín', 'chaqueta', 'abrigo', 'sombrero', 'gorro'] }
  ],
  'A2': [
    { name: 'Travel & Transportation', keywords: ['viaje', 'viajar', 'avión', 'tren', 'autobús', 'taxi', 'coche', 'bicicleta', 'estación', 'aeropuerto', 'hotel', 'billete', 'maleta', 'equipaje', 'pasaporte'] },
    { name: 'Shopping & Money', keywords: ['comprar', 'vender', 'tienda', 'mercado', 'supermercado', 'precio', 'dinero', 'euro', 'dólar', 'tarjeta', 'pagar', 'caro', 'barato', 'descuento'] },
    { name: 'Work & School', keywords: ['trabajo', 'trabajar', 'oficina', 'empresa', 'jefe', 'empleado', 'colega', 'sueldo', 'escuela', 'colegio', 'universidad', 'profesor', 'estudiante', 'clase', 'examen', 'libro', 'estudiar', 'aprender'] },
    { name: 'Weather & Nature', keywords: ['tiempo', 'clima', 'sol', 'lluvia', 'nube', 'viento', 'nieve', 'frío', 'calor', 'temperatura', 'naturaleza', 'árbol', 'flor', 'planta', 'montaña', 'río', 'mar', 'playa', 'lago'] },
    { name: 'Sports & Hobbies', keywords: ['deporte', 'fútbol', 'baloncesto', 'tenis', 'natación', 'correr', 'jugar', 'partido', 'equipo', 'hobby', 'música', 'cantar', 'bailar', 'tocar', 'pintar', 'leer', 'película', 'cine'] },
    { name: 'Food & Restaurant', keywords: ['restaurante', 'camarero', 'menú', 'plato', 'desayuno', 'almuerzo', 'cena', 'postre', 'ensalada', 'sopa', 'cocinar', 'receta', 'delicioso', 'rico', 'hambre', 'sed'] }
  ],
  'B1': [
    { name: 'Emotions & Feelings', keywords: ['emoción', 'sentir', 'feliz', 'triste', 'alegre', 'contento', 'enojado', 'preocupado', 'nervioso', 'enamorado', 'amor', 'odio', 'miedo', 'sorpresa', 'vergüenza'] },
    { name: 'Communication & Media', keywords: ['comunicación', 'hablar', 'decir', 'escuchar', 'teléfono', 'móvil', 'llamar', 'mensaje', 'correo', 'email', 'internet', 'ordenador', 'computadora', 'televisión', 'radio', 'periódico', 'noticia'] },
    { name: 'Social Life & Relationships', keywords: ['amigo', 'amistad', 'novio', 'novia', 'pareja', 'matrimonio', 'casarse', 'boda', 'divorcio', 'conocer', 'presentar', 'saludar', 'despedir', 'invitar', 'fiesta', 'celebración'] },
    { name: 'Culture & Entertainment', keywords: ['cultura', 'arte', 'museo', 'teatro', 'concierto', 'exposición', 'pintura', 'escultura', 'literatura', 'novela', 'poesía', 'artista', 'actor', 'actriz', 'espectáculo'] },
    { name: 'Environment & Ecology', keywords: ['medio ambiente', 'ecología', 'contaminar', 'reciclar', 'basura', 'residuo', 'energía', 'renovable', 'sostenible', 'planeta', 'tierra', 'clima', 'cambio climático'] }
  ],
  'B2': [
    { name: 'Business & Economy', keywords: ['negocio', 'economía', 'empresa', 'mercado', 'cliente', 'producto', 'servicio', 'venta', 'compra', 'beneficio', 'pérdida', 'inversión', 'banco', 'préstamo', 'deuda', 'crisis'] },
    { name: 'Politics & Society', keywords: ['política', 'gobierno', 'presidente', 'ministro', 'parlamento', 'ley', 'derecho', 'elección', 'votar', 'democracia', 'partido', 'sociedad', 'ciudadano', 'público', 'privado'] },
    { name: 'Technology & Innovation', keywords: ['tecnología', 'digital', 'innovación', 'aplicación', 'programa', 'software', 'hardware', 'datos', 'información', 'sistema', 'red', 'conectar', 'descargar', 'archivo'] },
    { name: 'Health & Medicine', keywords: ['medicina', 'enfermedad', 'tratamiento', 'curar', 'paciente', 'síntoma', 'diagnóstico', 'medicamento', 'receta', 'cirugía', 'operación', 'urgencia', 'ambulancia', 'clínica'] },
    { name: 'Education & Career', keywords: ['educación', 'formación', 'carrera', 'profesión', 'profesional', 'título', 'diploma', 'graduarse', 'especializar', 'experiencia', 'currículum', 'entrevista', 'contrato'] }
  ],
  'C1': [
    { name: 'Abstract Concepts', keywords: ['concepto', 'abstracto', 'filosof', 'teoría', 'principio', 'esencia', 'existencia', 'realidad', 'verdad', 'mentira', 'justicia', 'libertad', 'igualdad', 'derecho'] },
    { name: 'Science & Research', keywords: ['ciencia', 'científico', 'investigación', 'investigar', 'experimento', 'hipótesis', 'resultado', 'conclusión', 'método', 'análisis', 'estudiar', 'descubrimiento', 'laboratorio'] },
    { name: 'Law & Justice', keywords: ['ley', 'legal', 'tribunal', 'juez', 'abogado', 'juicio', 'sentencia', 'culpable', 'inocente', 'delito', 'crimen', 'justicia', 'derecho', 'constitución'] },
    { name: 'Psychology & Behavior', keywords: ['psicología', 'psicológico', 'mente', 'cerebro', 'pensamiento', 'pensar', 'comportamiento', 'conducta', 'personalidad', 'carácter', 'actitud', 'motivación'] },
    { name: 'Arts & Literature', keywords: ['arte', 'artístico', 'literatura', 'literario', 'obra', 'autor', 'escritor', 'poeta', 'estilo', 'género', 'crítica', 'interpretación', 'expresión'] }
  ],
  'C2': [
    { name: 'Philosophy & Ethics', keywords: ['filosofía', 'filosófico', 'ética', 'moral', 'valor', 'virtud', 'bien', 'mal', 'dilema', 'razonamiento', 'argumento', 'lógica', 'metafísica'] },
    { name: 'Advanced Science', keywords: ['física', 'química', 'biología', 'genética', 'molecular', 'átomo', 'partícula', 'evolución', 'célula', 'organismo', 'ecosistema'] },
    { name: 'Economics & Finance', keywords: ['economía', 'financiero', 'fiscal', 'monetario', 'inflación', 'deflación', 'mercado', 'bolsa', 'acción', 'capital', 'dividendo', 'renta'] },
    { name: 'Academic Discourse', keywords: ['académico', 'tesis', 'disertación', 'argumento', 'demostrar', 'refutar', 'evidencia', 'fundamento', 'postular', 'premisa', 'inferir'] },
    { name: 'Complex Expressions', keywords: ['expresión', 'locución', 'modismo', 'refrán', 'proverbio', 'metáfora', 'analogía', 'alusión', 'connotación'] }
  ]
};

async function categorizeWordsByTheme() {
  try {
    console.log('\n🎨 === СОЗДАНИЕ НАСТОЯЩИХ ТЕМАТИЧЕСКИХ НАБОРОВ ===\n');

    let totalThemesCreated = 0;

    for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
      console.log(`\n${'═'.repeat(70)}`);
      console.log(`📚 Обработка уровня ${level}`);
      console.log('═'.repeat(70) + '\n');

      const themes = THEMES[level];

      for (const theme of themes) {
        console.log(`\n🏷️  Тема: ${theme.name}`);
        console.log(`   Ключевые слова: ${theme.keywords.slice(0, 5).join(', ')}...`);

        // Находим слова по ключевым словам
        const keywordPattern = theme.keywords.map(k => `%${k}%`).join('|');

        // Используем SIMILAR TO для поиска по паттернам
        const words = await pool.query(`
          SELECT id, word
          FROM source_words_spanish
          WHERE level = $1
          AND (
            ${theme.keywords.map((_, i) => `LOWER(word) LIKE $${i + 2}`).join(' OR ')}
          )
          LIMIT 50
        `, [level, ...theme.keywords.map(k => `%${k}%`)]);

        if (words.rows.length >= 5) {  // Создаём набор только если нашли минимум 5 слов
          const title = `Spanish ${level}: ${theme.name}`;
          const description = `${level} level vocabulary: ${theme.name}`;

          console.log(`   ✅ Найдено слов: ${words.rows.length}`);
          console.log(`   Примеры: ${words.rows.slice(0, 5).map(w => w.word).join(', ')}`);

          // Создаём набор
          const setResult = await pool.query(`
            INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
            VALUES ('spanish', $1, $2, $3, $4, $5, true)
            RETURNING id
          `, [title, description, level, theme.name, words.rows.length]);

          console.log(`   📝 Создан набор (ID: ${setResult.rows[0].id})\n`);
          totalThemesCreated++;
        } else {
          console.log(`   ⏭️  Пропущено (найдено только ${words.rows.length} слов)\n`);
        }
      }
    }

    console.log('\n' + '═'.repeat(70));
    console.log(`\n🎉 Создано тематических наборов: ${totalThemesCreated}\n`);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

categorizeWordsByTheme();
