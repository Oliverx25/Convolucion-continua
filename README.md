# Convolución continua

Aplicación web que calcula y grafica la **convolución continua** de dos señales:

**(f * g)(t) = ∫ f(τ) g(t − τ) dτ**

## Características

- **Dos señales**: elige f(t) y g(t) entre señales predefinidas o expresiones personalizadas
- **Tres gráficas**: f(t), g(t) y (f * g)(t)
- **Señales predefinidas**: onda cuadrada, diente de sierra, triangular, sinusoidal, pulso rectangular
- **Expresión personalizada**: variable `t` (sintaxis mathjs) para f y/o g

## Uso

- Selecciona la señal **f(t)** y, si es “Expresión personalizada”, escribe la expresión (ej: `sin(2*pi*t)`).
- Selecciona la señal **g(t)** de la misma forma.
- La convolución se calcula por integración numérica (regla del trapecio) en la ventana τ ∈ [-2, 2].

## Desarrollo

```bash
npm install
npm run dev
```

## Despliegue en Vercel

Conecta el repositorio en [Vercel](https://vercel.com) o usa `npx vercel`.

## Tecnologías

- Vite + React + TypeScript
- Recharts
- Tailwind CSS
- mathjs (expresiones personalizadas)
