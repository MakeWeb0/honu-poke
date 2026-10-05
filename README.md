# Honu Poké & More

Web de una página para Honu Poké & More (C/ del Aeroplano, 4, Local 2, San Vicente del Raspeig).
Misma estructura y trabajo de animación que la de Honu Açaí, con la identidad de Poké: verde, amarillo, rosa y crema.

## Cómo verla

Abre `index.html`. Para que los vídeos y las máscaras del logo funcionen igual que en producción, mejor con servidor local:

    python -m http.server 8000

y entra en http://localhost:8000

No hay nada que instalar: las fuentes (Anton, Yellowtail, Outfit) y GSAP van incluidos en `assets/`, sin llamadas a Google Fonts ni CDN.

## Estructura

    index.html          Toda la página
    css/style.css       Estilos base (tokens de color y tipografía arriba del todo)
    tienda.html         Tienda online (pokes, wraps, gyozas, postres y bebidas)
    css/tienda.css      Estilos de la tienda
    js/shop.js          Productos, personalización, bolsa y pedido (CONFIG arriba: WhatsApp, horario)
    css/personalidad.css  Capa de carácter de marca: grano de papel, ondas, sello, wrap, chips y nav
    js/main.js          Interacciones (GSAP + ScrollTrigger)
    assets/img/         Logo, tortuga, stickers recortados del pliego de marca, fotogramas de los vídeos
    assets/video/       Los tres vídeos recomprimidos (≈ 3,8 MB en total con el del hero)
    assets/fonts/       Fuentes en woff2
    assets/Carta_HonuPoke_Febrero.pdf   La carta de febrero (enlace "Ábrela en PDF")

## Secciones

1. **Hero** — "Tu bowl, tus reglas. Be Honu!", vídeo en arco, stickers de marca y la nota de Google (4,8 · 404).
2. **Sobre nosotros** — "Es saludable, pero sabe a capricho" y una línea tipográfica con lo que hay (sin tarjetas ni contadores).
3. **La carta** — tres pestañas:
   - *Pokes de la casa*: Honu, Maui, Oahu, Aya, Wiki Liki Hot, Ío, Moana y Aina, en lista tipográfica de carta de papel, con hazlo menú y extras.
   - *Monta tu bowl*: constructor de poke o wrap en 5 pasos con los límites de la carta (base 1-2, salsa 2, proteína 1, toppings 4, crujientes 2; en wrap, 1 salsa y 1 crujiente), extras, tamaño, caliente/frío y "hazlo menú". Calcula el total y permite copiar el pedido, llamar o ir a Uber Eats.
   - *Menú, postres y bebidas*: postres, refrescos, cervezas, gyozas y bebidas.
4. **Cómo lo hacemos** — los tres vídeos (poke de salmón, wrap, bowl para llevar). Arrancan solos al entrar en pantalla, con los pasos encendiéndose según el segundo del vídeo (`data-steps` en cada `<ol class="steps">`). Clic en el vídeo = sonido.
5. **Reseñas** — 4,8 en Google y una reseña de Tripadvisor.
6. **Dónde** — dirección, horario en una línea, teléfono, Instagram y bloque de pedido.

## Datos que conviene revisar antes de publicar

- **Horario**: todos los días, 13:00–16:00 y 20:00–23:30 (confirmado por el cliente). Está escrito en tres sitios: el bloque "Dónde estamos" y el rótulo del nav en el HTML, y el JSON-LD de la cabecera.
- **Precios de los pokes de la casa**: la carta solo indica el menú (15,90 € mediano / 16,90 € grande), no el precio suelto. Por eso no se muestra precio individual. En Uber Eats el Honu figura a 13,90 €.
- **Teléfono**: 865 79 59 88 (el de la ficha de Google). Se usa en los enlaces `tel:` y el JSON-LD.
- **Reseñas**: solo hay una frase de Tripadvisor (sin nombre) y la nota global de Google. Si se quieren más reseñas con nombre, se añaden en `.revs__grid`.
- **Dominio**: honupoke.es hoy es un WordPress en construcción. La imagen para compartir en redes (`og.jpg`) usa ruta relativa; al publicar conviene ponerle la URL absoluta en `index.html`.
- Los pokes de la casa y los nombres/ingredientes están transcritos de la carta de febrero (PDF).
- Los stickers (corazón con tortuga, globo, "Be Honu!", cuadrado de logo) están recortados del pliego de marca; si tenéis los SVG originales se sustituyen en `assets/img/` sin tocar nada más.

## Notas técnicas

- Animación contenida a propósito: hero, títulos, entradas de sección y vídeos con pasos.
- Respeta `prefers-reduced-motion`.
- El scroll suave de los enlaces va en JS: con `scroll-behavior:smooth` en CSS, ScrollTrigger mide mal al refrescar.
- Datos estructurados schema.org `Restaurant` con dirección, horario y valoración.

## Tienda (`tienda.html`)

- Los productos y precios están en `js/shop.js` (`PRODUCTS`). Los pokes de la casa, el haz tu poke, el wrap, las gyozas, los postres y las bebidas salen de la carta de febrero.
- La bolsa se guarda en el navegador (`localStorage`). Se elige la hora de recogida dentro del horario; el pago es en el local.
- **La web no cobra ni envía pedidos sola** (es una página estática). Al preparar el pedido: si en `CONFIG.whatsapp` hay un número, aparece el botón "Enviar por WhatsApp" con el pedido ya escrito; si está vacío, se ofrece copiar el pedido o llamar al local.
- **Precio de los pokes de la casa**: la carta solo da el del menú (15,90 / 16,90 €). Se usa 11,90 € (el del "haz tu poke") y el menú suma 4 €, que cuadra con las dos tarifas. Confirmar con el local y cambiar `POKE_PRICE` si procede.
