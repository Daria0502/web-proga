#  Сайт на React с TypeScript для вычислений рядов Маклорена и построения графиков

В этом примере мы создадим React-приложение, аналогичное предыдущему, но с использованием **TypeScript**. Мы также будем использовать **Bun** для создания и запуска проекта.

---

## Шаг 1: Настройка проекта с помощью Bun

1. Убедитесь, что у вас установлен **Bun**. Если нет, установите его:
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. Создайте новый React-проект с TypeScript:
   ```bash
   bun create react mclaurin-calculator --template typescript
   cd mclaurin-calculator
   ```

3. Установите необходимые зависимости:
   ```bash
   bun add echarts-for-react echarts
   ```

---

## Шаг 2: Реализация компонентов

### 1. Компонент `App.tsx`

Это главный компонент приложения. Он будет содержать логику вычислений, формы для ввода данных и график. Мы добавим аннотации типов для переменных и функций.

```tsx
import React, { useState } from "react";
import ReactECharts from "echarts-for-react";

// Интерфейс для данных графика
interface ChartData {
  x: number[];
  y: number[];
}

const App: React.FC = () => {
  const [points, setPoints] = useState<string[]>([]);
  const [functionType, setFunctionType] = useState<"sin" | "cos" | "exp">("sin");
  const [chartData, setChartData] = useState<ChartData>({ x: [], y: [] });

  // Функция для вычисления ряда Маклорена
  const calculateMaclaurin = (func: "sin" | "cos" | "exp", xValues: number[], terms: number = 10): number[] => {
    const results: number[] = [];
    for (let x of xValues) {
      let result = 0;
      for (let n = 0; n < terms; n++) {
        if (func === "sin") {
          result += Math.pow(-1, n) * Math.pow(x, 2 * n + 1) / factorial(2 * n + 1);
        } else if (func === "cos") {
          result += Math.pow(-1, n) * Math.pow(x, 2 * n) / factorial(2 * n);
        } else if (func === "exp") {
          result += Math.pow(x, n) / factorial(n);
        }
      }
      results.push(result);
    }
    return results;
  };

  // Факториал
  const factorial = (n: number): number => {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };

  // Обработчик отправки формы
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const xValues = points.map((point) => parseFloat(point));
    const yValues = calculateMaclaurin(functionType, xValues);

    setChartData({
      x: xValues,
      y: yValues,
    });
  };

  // Опции для ECharts
  const chartOptions = {
    xAxis: {
      type: "value",
      name: "x",
    },
    yAxis: {
      type: "value",
      name: "y",
    },
    series: [
      {
        data: chartData.x.map((x, index) => [x, chartData.y[index]]),
        type: "line",
        smooth: true,
        name: `${functionType}(x)`,
      },
      {
        data: chartData.x.map((x, index) => [x, chartData.y[index]]),
        type: "scatter",
        name: "Точки",
      },
    ],
    tooltip: {
      trigger: "axis",
    },
    legend: {
      data: [`${functionType}(x)`, "Точки"],
    },
  };

  return (
    <div className="App">
      <h1>Вычисление значений функций с использованием рядов Маклорена</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Введите точки (через запятую):
          <input
            type="text"
            value={points.join(",")}
            onChange={(e) => setPoints(e.target.value.split(","))}
          />
        </label>
        <br />
        <label>
          Выберите функцию:
          <select
            value={functionType}
            onChange={(e) => setFunctionType(e.target.value as "sin" | "cos" | "exp")}
          >
            <option value="sin">sin(x)</option>
            <option value="cos">cos(x)</option>
            <option value="exp">exp(x)</option>
          </select>
        </label>
        <br />
        <button type="submit">Построить график</button>
      </form>
      <ReactECharts option={chartOptions} style={{ height: "500px", marginTop: "20px" }} />
    </div>
  );
};

export default App;
```

---

## Шаг 3: Запуск приложения с помощью Bun

1. Запустите приложение в режиме разработки:
   ```bash
   bun run dev
   ```

2. Откройте браузер и проверьте работу.

---

## Объяснение кода

### 1. Аннотации типов
- Мы добавили аннотации типов для переменных, таких как `points` (`string[]`), `functionType` (`"sin" | "cos" | "exp"`), и `chartData` (`ChartData`).
- Функция `calculateMaclaurin` принимает параметры с явно указанными типами и возвращает массив чисел (`number[]`).

### 2. Интерфейс `ChartData`
- Мы создали интерфейс `ChartData` для хранения данных графика (`x` и `y` — массивы чисел).

### 3. Обработка событий
- Для обработки событий формы используется тип `React.FormEvent<HTMLFormElement>`.

---

## Пример работы

1. Введите точки: `0, 0.5, 1, 1.5, 2`.
2. Выберите функцию: `sin(x)`.
3. Нажмите "Построить график".
4. На экране появится график функции `sin(x)` и точки, соответствующие введённым значениям.

---

## Преимущества использования TypeScript

1. **Статическая типизация: ** TypeScript помогает избежать ошибок типов на этапе написания кода.
2. **Улучшенная читаемость: ** Аннотации типов делают код более понятным для других разработчиков.
3. **Автодополнение: ** TypeScript предоставляет поддержку автодополнения в IDE, что ускоряет разработку.

---

## Дополнительные улучшения

1. **Добавление интерактивности:** Разрешите пользователю изменять количество членов ряда Маклорена.
2. **Анимации:** Используйте анимации ECharts для плавного отображения графика.
3. **Ошибки ввода:** Добавьте проверку корректности вводимых данных.

