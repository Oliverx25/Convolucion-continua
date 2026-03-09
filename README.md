# Convolución continua

Aplicación web interactiva para calcular y visualizar la **convolución continua** de dos señales en tiempo, con animación didáctica del proceso *flip & shift*. Pensada como apoyo en la asignatura de **Procesamiento Digital de Señales (PDS)**.

---

## Definición matemática

La convolución continua de dos señales \( f(t) \) y \( g(t) \) se define como:

$$(f * g)(t) = \int_{-\infty}^{+\infty} f(\tau)\, g(t - \tau)\, d\tau$$

En esta aplicación la integral se restringe a una **ventana finita** \(\tau \in [\tau_{\min}, \tau_{\max}]\) (configurable como rango del eje \(t\), por ejemplo \([-R, R]\)), de modo que:

$$(f * g)(t) \approx \int_{\tau_{\min}}^{\tau_{\max}} f(\tau)\, g(t - \tau)\, d\tau$$

### Interpretación (flip & shift)

- **Variable de integración**: \(\tau\) recorre el eje horizontal; \(t\) es un parámetro fijo en cada instante.
- **Señal fija**: \(f(\tau)\) se dibuja tal cual en el eje \(\tau\).
- **Señal desplazada e invertida**: \(g(t - \tau)\) corresponde a **reflejar** \(g\) en el origen y luego **desplazarla** \(t\) unidades. Al animar \(t\), esta señal "se desliza" sobre \(f(\tau)\).
- **Integrando**: el producto \(f(\tau)\, g(t - \tau)\) es lo que se integra; en la animación se sombrea en **verde** cuando es positivo y en **rojo** cuando es negativo.
- **Resultado**: el valor \((f*g)(t)\) es el **área neta** bajo la curva del integrando en ese instante \(t\).

Esto conecta directamente con la interpretación de la convolución en PDS: respuesta de un sistema LTI (lineal e invariante en el tiempo) ante una entrada, o superposición de respuestas impulsivas.

---

## Implementación de la convolución

### Integración numérica

La integral se aproxima por la **regla del trapecio** sobre una malla equiespaciada en \(\tau\):

1. Se elige un número de puntos \(N\) (en el código, `N_INTEGRAL`, p. ej. 600) en \([\tau_{\min}, \tau_{\max}]\).
2. Para cada tiempo de salida \(t\) en una lista de valores (p. ej. 400 puntos entre \(\tau_{\min}\) y \(\tau_{\max}\)):
   - Se evalúa \(f(\tau_k)\) y \(g(t - \tau_k)\) en cada \(\tau_k\).
   - Se forma la suma trapezoidal del integrando \(f(\tau)\, g(t - \tau)\) con pesos 0.5 en los extremos y 1 en los puntos interiores.
   - Se multiplica por el paso \(\Delta\tau = (\tau_{\max} - \tau_{\min})/(N-1)\).

Archivo relevante: `src/lib/convolution.ts` — función `computeConvolution`.

### Señales

Cada señal se representa como una función \(t \mapsto \text{valor}\) (tipo `SignalFunction`):

- **Predefinidas** (`src/lib/signals.ts`): onda cuadrada, diente de sierra, triangular, sinusoidal, pulso rectangular (periodo \(T=1\), extensión periódica).
- **Expresión personalizada** (`src/lib/customExpression.ts`): cadena evaluada con [mathjs](https://mathjs.org/) usando la variable `t` (ej: `sin(2*pi*t)`, pulsos con lógica tipo `1*(t>=0)*(t<1)`).
- **Función a trozos**: varias líneas con formato `a b expr` indican que en el intervalo \([a,b]\) la señal vale la expresión `expr` (variable `t`). Fuera de los intervalos definidos se toma 0.

La ventana de integración y el rango de la gráfica se configuran con el mismo parámetro (p. ej. \(t \in [-R, R]\)), de modo que la convolución se calcula y se muestra en ese rango.

---

## Interfaz y uso

### Sección "Señales"

- **Señal f(t)** y **Señal g(t)**: selector entre presets, "Función a trozos" o "Expresión personalizada".
- **Rango de la gráfica (eje t)**: define \(\tau_{\min} = -R\), \(\tau_{\max} = R\) (y por tanto la ventana de integración y el rango donde se calcula \((f*g)(t)\)).

### Sección "Animación didáctica"

- Gráfica en el eje \(\tau\):
  - **f(τ)**: señal fija (línea continua).
  - **g(t − τ)**: señal desplazada/invertida (línea punteada) que se mueve al variar \(t\).
  - **Área del integrando**: verde donde \(f(\tau)\,g(t-\tau) > 0\), roja donde \(< 0\).
- **Controles**:
  - Reproducir / Pausar / Reanudar: animación automática de \(t\) desde \(\tau_{\min}\) hasta \(\tau_{\max}\).
  - Reiniciar: vuelve \(t\) al inicio.
  - Slider "t": mueve \(t\) manualmente (flip & shift a mano).
- El **dominio del eje Y** de esta gráfica se calcula de forma fija a partir de los rangos de \(f\), \(g\) y del producto, para que la escala no cambie durante la animación y se aprecie mejor el movimiento.

### Sección "Convolución (f * g)(t)"

- Gráfica de \((f*g)(t)\) en el eje \(t\).
- Durante la animación (o al mover el slider), la curva se va dibujando de forma progresiva hasta el valor actual de \(t\), a modo de "monitor" en tiempo real.

---

## Relación con Procesamiento Digital de Señales

- **Convolución continua**: definición, propiedades (conmutativa, asociativa, distributiva frente a la suma), interpretación como "promedio ponderado" de la entrada con la respuesta al impulso.
- **Sistemas LTI**: la salida ante una entrada \(x(t)\) es \(y(t) = (h * x)(t)\) con \(h\) la respuesta al impulso; la animación ilustra cómo se "arrastra" esa respuesta al variar \(t\).
- **Señales típicas**: pulsos rectangulares, sinusoides, ondas periódicas; en el proyecto se usan tanto señales periódicas (presets) como no periódicas (custom/piecewise).
- **Integración numérica**: regla del trapecio como método de cuadratura para evaluar la integral de convolución en un ordenador (base para entender después la convolución discreta y la FFT).

---

## Estructura del proyecto

```
src/
├── App.tsx                    # Estado, controles, cálculo de convolución y dominios
├── lib/
│   ├── convolution.ts         # computeConvolution, linspace, computeAnimationYDomain
│   ├── customExpression.ts   # createCustomSignal, parsePiecewiseText, createPiecewiseSignal
│   ├── signals.ts            # Señales predefinidas y catálogo
│   ├── formatAxisTick.ts     # Formato de etiquetas numéricas en ejes
│   └── fourier.ts            # Re-export del tipo SignalFunction
└── components/
    ├── TimeChart.tsx         # Gráfica de una señal en el tiempo (p. ej. (f*g)(t))
    └── SlidingAnimationChart.tsx  # f(τ), g(t−τ), áreas del integrando, dominio Y fijo
```

---

## Desarrollo

```bash
npm install
npm run dev
```

Build para producción: `npm run build`. Se puede desplegar en [Vercel](https://vercel.com) u otro host estático.

---

## Tecnologías

- **Vite** + **React** + **TypeScript**
- **Recharts**: gráficas (LineChart, ComposedChart, Area, ejes con dominio fijo)
- **Tailwind CSS**: estilos
- **mathjs**: evaluación de expresiones matemáticas para señales personalizadas y a trozos
