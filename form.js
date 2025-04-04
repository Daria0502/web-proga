// Самовызывающаяся анонимная функция (IIFE) для изоляции кода
(() => {
    // Строгий режим JavaScript для более безопасного выполнения
    "use strict";

    // Получаем объект интернационализации WordPress (для переводов)
    const e = window.wp.i18n

    // Функция для преобразования строки в абсолютное целое число
    // Пример: t("-5") вернет 5
    const t = e => Math.abs(parseInt(e, 10))

    // Функция для создания и отправки кастомных событий Contact Form 7
    // Параметры:
    // e - элемент или селектор элемента
    // t - тип события (например, "statuschanged")
    // a - дополнительные данные события (detail)
    const a = (e, t, a) => {
        // Создаем новое кастомное событие с префиксом "wpcf7"
        const n = new CustomEvent(`wpcf7 ${t}`, {
            bubbles: !0, // Событие всплывает по DOM
            detail: a    // Дополнительные данные события
        });
        // Если e - строка (селектор), находим соответствующий элемент
        "string" == typeof e && (e = document.querySelector(e)),
        // Отправляем событие на элементе
        e.dispatchEvent(n)
    }

    // Функция для управления статусами формы
    // Преобразует внутренние статусы CF7 в CSS-классы
    const n = (e, t) => {
        // Соответствие внутренних статусов и их CSS-представлений
        const n = new Map([
            ["init", "init"],
            ["validation_failed", "invalid"],
            ["acceptance_missing", "unaccepted"],
            ["spam", "spam"],
            ["aborted", "aborted"],
            ["mail_sent", "sent"],
            ["mail_failed", "failed"],
            ["submitting", "submitting"],
            ["resetting", "resetting"],
            ["validating", "validating"],
            ["payment_required", "payment-required"]
        ]);

        // Если статус есть в маппинге, заменяем его
        n.has(t) && (t = n.get(t)),

        // Если статус нестандартный, создаем кастомный CSS-класс
        Array.from(n.values()).includes(t) || (t = `custom-${t = (t = t.replace(/[^0-9a-z]+/i, " ").trim()).replace(/\s+/, "-")}`);

        // Получаем текущий статус формы
        const r = e.getAttribute("data-status");

        // Обновляем статус формы
        e.wpcf7.status = t,
        e.setAttribute("data-status", t),
        e.classList.add(t),

        // Если статус изменился
        r && r !== t) {
            // Удаляем старый класс статуса
            e.classList.remove(r);

            // Подготавливаем данные для события
            const t = {
                contactFormId: e.wpcf7.id,
                pluginVersion: e.wpcf7.pluginVersion,
                contactFormLocale: e.wpcf7.locale,
                unitTag: e.wpcf7.unitTag,
                containerPostId: e.wpcf7.containerPost,
                status: e.wpcf7.status,
                prevStatus: r
            };

            // Отправляем событие об изменении статуса
            a(e, "statuschanged", t)
        }

        return t
    }

    // Функция для работы с API WordPress (REST)
    const r = e => {
        // Получаем корневой URL и namespace API из глобального объекта wpcf7
        const { root: t, namespace: a = "contact-form-7/v1" } = wpcf7.api;

        // Применяем middleware функции (если есть)
        return c.reduceRight(((e, t) => a => t(a, e)), (e => {
            // Подготовка параметров запроса
            let n, r, { url: c, path: o, endpoint: s, headers: i, body: l, data: p, ...d } = e;

            // Формируем endpoint URL
            "string" == typeof s && (n = a.replace(/^\/|\/$/g, ""),
                r = s.replace(/^\//, ""),
                o = r ? n + "/" + r : n),

                // Формируем полный URL
                "string" == typeof o && (-1 !== t.indexOf("?") && (o = o.replace("?", "&")),
                o = o.replace(/^\//, ""),
                c = t + o,

                // Устанавливаем заголовки по умолчанию
                i = {
                    Accept: "application/json, */*;q=0.1",
                    ...i
                },
                // Удаляем nonce (используется в WordPress для проверки)
                delete i["X-WP-Nonce"],

                // Если есть данные, преобразуем в JSON
                p && (l = JSON.stringify(p),
                    i["Content-Type"] = "application/json");

            // Сообщения об ошибках
            const f = {
                code: "fetch_error",
                message: "You are probably offline."
            }
            const u = {
                code: "invalid_json",
                message: "The response is not a valid JSON response."
            };

            // Выполняем fetch запрос
            return window.fetch(c || o || window.location.href, {
                ...d,
                headers: i,
                body: l
            }).then((e => Promise.resolve(e).then((e => {
                // Проверяем статус ответа
                if (e.status >= 200 && e.status < 300)
                    return e;
                throw e
            }
            )).then((e => {
                // Обрабатываем успешный ответ
                if (204 === e.status)
                    return null;
                if (e && e.json)
                    return e.json().catch((() => {
                        throw u
                    }
                    ));
                throw u
            }
            ))), (() => {
                throw f
            }
            ))
        }
        ))(e)
    }

    // Массив для middleware функций
    const c = [];

    // Функция валидации формы
    function o(e, t = {}) {
        const { target: a, scope: r = e, ...c } = t;

        // Если у формы нет схемы валидации, выходим
        if (void 0 === e.wpcf7?.schema)
            return;

        // Копируем схему валидации
        const o = {
            ...e.wpcf7.schema
        };

        // Проверяем целевой элемент
        if (void 0 !== a) {
            // Если элемент не принадлежит форме
            if (!e.contains(a))
                return;
            // Если элемент не имеет обертки с data-name
            if (!a.closest(".wpcf7-form-control-wrap[data-name]"))
                return;
            // Если элемент в блоке novalidate
            if (a.closest(".novalidate"))
                return
        }

        // Собираем все поля формы
        const p = r.querySelectorAll(".wpcf7-form-control-wrap")
        // Собираем данные формы в FormData
        const d = Array.from(p).reduce(((e, t) => (t.closest(".novalidate") || t.querySelectorAll(":where( input, textarea, select ):enabled").forEach((t => {
            if (t.name)
                switch (t.type) {
                    case "button":
                    case "image":
                    case "reset":
                    case "submit":
                        break;
                    case "checkbox":
                    case "radio":
                        t.checked && e.append(t.name, t.value);
                        break;
                    case "select-multiple":
                        for (const a of t.selectedOptions)
                            e.append(t.name, a.value);
                        break;
                    case "file":
                        for (const a of t.files)
                            e.append(t.name, a);
                        break;
                    default:
                        e.append(t.name, t.value)
                }
        }
        )),
            e)), new FormData)

        // Запоминаем текущий статус формы
        const f = e.getAttribute("data-status");

        // Устанавливаем статус "validating" и выполняем валидацию
        Promise.resolve(n(e, "validating")).then((n => {
            if (void 0 !== swv) {
                // Выполняем валидацию через SWV (возможно, это сторонняя библиотека валидации)
                const n = swv.validate(o, d, t);

                // Обрабатываем результаты валидации для каждого поля
                for (const t of p) {
                    if (void 0 === t.dataset.name)
                        continue;
                    const c = t.dataset.name;
                    if (n.has(c)) {
                        const { error: t, validInputs: a } = n.get(c);
                        // Очищаем предыдущие ошибки
                        i(e, c),
                            // Устанавливаем новые ошибки (если есть)
                            void 0 !== t && s(e, c, t, {
                                scope: r
                            }),
                            // Обновляем отражение валидных значений
                            l(e, c, null != a ? a : [])
                    }
                    if (t.contains(a))
                        break
                }
            }
        }
        )).finally((() => {
            // Восстанавливаем исходный статус формы
            n(e, f)
        }
        ))
    }

    // Добавление middleware для API
    r.use = e => {
        c.unshift(e)
    }
    ;

    // Функция для отображения ошибок валидации
    const s = (e, t, a, n) => {
        const { scope: r = e, ...c } = null != n ? n : {}
        // Генерируем уникальный ID для сообщения об ошибке
        const o = `${e.wpcf7?.unitTag}-ve-${t}`.replaceAll(/[^0-9a-z_-]+/gi, "")
        // Находим поле ввода, к которому относится ошибка
        const s = e.querySelector(`.wpcf7-form-control-wrap[data-name="${t}"] .wpcf7-form-control`);

        // Создаем элемент сообщения об ошибке для screen readers
        (() => {
            const t = document.createElement("li");
            t.setAttribute("id", o),
                s && s.id ? t.insertAdjacentHTML("beforeend", `<a href="#${s.id}">${a}</a>`) : t.insertAdjacentText("beforeend", a),
                e.wpcf7.parent.querySelector(".screen-reader-response ul").appendChild(t)
        }
        )(),

            // Добавляем визуальное сообщение об ошибке для каждого соответствующего поля
            r.querySelectorAll(`.wpcf7-form-control-wrap[data-name="${t}"]`).forEach((e => {
                const t = document.createElement("span");
                t.classList.add("wpcf7-not-valid-tip"),
                    t.setAttribute("aria-hidden", "true"),
                    t.insertAdjacentText("beforeend", a),
                    e.appendChild(t),
                    // Обновляем ARIA-атрибуты для доступности
                    e.querySelectorAll("[aria-invalid]").forEach((e => {
                        e.setAttribute("aria-invalid", "true")
                    }
                    )),
                    e.querySelectorAll(".wpcf7-form-control").forEach((e => {
                        e.classList.add("wpcf7-not-valid"),
                            e.setAttribute("aria-describedby", o),
                            "function" == typeof e.setCustomValidity && e.setCustomValidity(a),
                            // Особое поведение для плавающих подсказок
                            e.closest(".use-floating-validation-tip") && (e.addEventListener("focus", (e => {
                                t.setAttribute("style", "display: none")
                            }
                            )),
                                t.addEventListener("click", (e => {
                                    t.setAttribute("style", "display: none")
                                }
                                ))
                            )
                    }
                    ))
            }
            ))
    }

    // Функция для очистки ошибок валидации поля
    const i = (e, t) => {
        // Находим ID сообщения об ошибке
        const a = `${e.wpcf7?.unitTag}-ve-${t}`.replaceAll(/[^0-9a-z_-]+/gi, "");
        // Удаляем сообщение для screen readers
        e.wpcf7.parent.querySelector(`.screen-reader-response ul li#${a}`)?.remove(),
            // Очищаем визуальные сообщения об ошибках
            e.querySelectorAll(`.wpcf7-form-control-wrap[data-name="${t}"]`).forEach((e => {
                e.querySelector(".wpcf7-not-valid-tip")?.remove(),
                    // Восстанавливаем ARIA-атрибуты
                    e.querySelectorAll("[aria-invalid]").forEach((e => {
                        e.setAttribute("aria-invalid", "false")
                    }
                    )),
                    e.querySelectorAll(".wpcf7-form-control").forEach((e => {
                        e.removeAttribute("aria-describedby"),
                            e.classList.remove("wpcf7-not-valid"),
                            "function" == typeof e.setCustomValidity && e.setCustomValidity("")
                    }
                    ))
            }
            ))
    }

    // Функция для обновления отраженных значений (например, в output элементах)
    const l = (e, t, a) => {
        e.querySelectorAll(`[data-reflection-of="${t}"]`).forEach((e => {
            if ("output" === e.tagName.toLowerCase()) {
                const t = e;
                // Если нет значений, используем значение по умолчанию
                0 === a.length && a.push(t.dataset.default),
                    // Обновляем текст output элемента
                    a.slice(0, 1).forEach((e => {
                        e instanceof File && (e = e.name),
                            t.textContent = e
                    }
                    ))
            } else
                // Обработка более сложных случаев с несколькими output элементами
                e.querySelectorAll("output").forEach((e => {
                    e.hasAttribute("data-default") ? 0 === a.length ? e.removeAttribute("hidden") : e.setAttribute("hidden", "hidden") : e.remove()
                }
                )),
                // Создаем новые output элементы для каждого значения
                a.forEach((a => {
                    a instanceof File && (a = a.name);
                    const n = document.createElement("output");
                    n.setAttribute("name", t),
                        n.textContent = a,
                        e.appendChild(n)
                }
                ))
        }
        ))
    }

    // Функция отправки формы
    function p(e, t = {}) {
        // Проверяем, не заблокирована ли форма
        if (wpcf7.blocked)
            return d(e),
                // Устанавливаем статус "submitting"
                void n(e, "submitting");

        // Собираем данные формы
        const c = new FormData(e);
        // Добавляем данные кнопки отправки (если есть)
        t.submitter && t.submitter.name && c.append(t.submitter.name, t.submitter.value);

        // Подготавливаем данные для события
        const o = {
            contactFormId: e.wpcf7.id,
            pluginVersion: e.wpcf7.pluginVersion,
            contactFormLocale: e.wpcf7.locale,
            unitTag: e.wpcf7.unitTag,
            containerPostId: e.wpcf7.containerPost,
            status: e.wpcf7.status,
            // Фильтруем служебные поля (начинающиеся с _)
            inputs: Array.from(c, (e => {
                const t = e[0]
                const a = e[1];
                return !t.match(/^_/) && {
                    name: t,
                    value: a
                }
            }
            )).filter((e => !1 !== e)),
            formData: c
        };

        // Отправляем данные формы на сервер
        r({
            endpoint: `contact-forms/${e.wpcf7.id}/feedback`,
            method: "POST",
            body: c,
            wpcf7: {
                endpoint: "feedback",
                form: e,
                detail: o
            }
        }).then((t => {
            // Обновляем статус формы на основе ответа сервера
            const r = n(e, t.status);
            // Обновляем данные события
            o.status = t.status,
                o.apiResponse = t,
                // Отправляем соответствующие события в зависимости от статуса
                ["invalid", "unaccepted", "spam", "aborted"].includes(r) ? a(e, r, o) : ["sent", "failed"].includes(r) && a(e, `mail ${r}`, o),
                // Отправляем общее событие submit
                a(e, "submit", o),
                t
        }
        )).then((t => {
            // Обрабатываем успешный ответ сервера
            t.posted_data_hash && (e.querySelector('input[name="_wpcf7_posted_data_hash"]').value = t.posted_data_hash),
                // Если письмо отправлено, сбрасываем форму
                "mail_sent" === t.status && (e.reset(),
                    e.wpcf7.resetOnMailSent = !0),
                // Отображаем ошибки валидации (если есть)
                t.invalid_fields && t.invalid_fields.forEach((t => {
                    s(e, t.field, t.message)
                }
                )),
                // Обновляем сообщения для пользователя
                e.wpcf7.parent.querySelector('.screen-reader-response [role="status"]').insertAdjacentText("beforeend", t.message),
                e.querySelectorAll(".wpcf7-response-output").forEach((e => {
                    e.innerText = t.message
                }
                ))
        }
        )).catch((e => console.error(e)))
    }

    // Middleware для обработки запросов к API
    r.use(((e, t) => {
        // Если это запрос на отправку формы
        if (e.wpcf7 && "feedback" === e.wpcf7.endpoint) {
            const { form: t, detail: r } = e.wpcf7;
            // Очищаем предыдущие ошибки
            d(t),
                // Отправляем событие "beforesubmit"
                a(t, "beforesubmit", r),
                // Устанавливаем статус "submitting"
                n(t, "submitting")
        }
        return t(e)
    }
    ));

    // Функция для очистки всех сообщений об ошибках
    const d = e => {
        // Очищаем ошибки валидации для всех полей
        e.querySelectorAll(".wpcf7-form-control-wrap").forEach((t => {
            t.dataset.name && i(e, t.dataset.name)
        }
        )),
            // Очищаем общие сообщения
            e.wpcf7.parent.querySelector('.screen-reader-response [role="status"]').innerText = "",
            e.querySelectorAll(".wpcf7-response-output").forEach((e => {
                e.innerText = ""
            }
            ))
    }

    // Функция сброса формы
    function f(e) {
        // Собираем данные формы
        const t = new FormData(e)
        // Подготавливаем данные для события
        const c = {
            contactFormId: e.wpcf7.id,
            pluginVersion: e.wpcf7.pluginVersion,
            contactFormLocale: e.wpcf7.locale,
            unitTag: e.wpcf7.unitTag,
            containerPostId: e.wpcf7.containerPost,
            status: e.wpcf7.status,
            // Фильтруем служебные поля
            inputs: Array.from(t, (e => {
                const t = e[0]
                const a = e[1];
                return !t.match(/^_/) && {
                    name: t,
                    value: a
                }
            }
            )).filter((e => !1 !== e)),
            formData: t
        };

        // Запрашиваем обновленные данные для формы (например, капчу)
        r({
            endpoint: `contact-forms/${e.wpcf7.id}/refill`,
            method: "GET",
            wpcf7: {
                endpoint: "refill",
                form: e,
                detail: c
            }
        }).then((t => {
            // Восстанавливаем статус формы
            e.wpcf7.resetOnMailSent ? (delete e.wpcf7.resetOnMailSent,
                n(e, "mail_sent")) : n(e, "init"),
                // Сохраняем ответ сервера
                c.apiResponse = t,
                // Отправляем событие reset
                a(e, "reset", c)
        }
        )).catch((e => console.error(e)))
    }

    // Middleware для обработки запросов на обновление формы
    r.use(((e, t) => {
        // Если это запрос на обновление формы
        if (e.wpcf7 && "refill" === e.wpcf7.endpoint) {
            const { form: t, detail: a } = e.wpcf7;
            // Очищаем ошибки
            d(t),
                // Устанавливаем статус "resetting"
                n(t, "resetting")
        }
        return t(e)
    }
    ));

    // Функция для обновления капчи
    const u = (e, t) => {
        for (const a in t) {
            const n = t[a];
            // Очищаем значения полей капчи
            e.querySelectorAll(`input[name="${a}"]`).forEach((e => {
                e.value = ""
            }
            )),
                // Обновляем изображение капчи
                e.querySelectorAll(`img.wpcf7-captcha-${a.replaceAll(":", "")}`).forEach((e => {
                    e.setAttribute("src", n)
                }
                ));
            // Извлекаем ID капчи из URL изображения
            const r = /([0-9]+)\.(png|gif|jpeg)$/.exec(n);
            r && e.querySelectorAll(`input[name="_wpcf7_captcha_challenge_ ${a}"]`).forEach((e => {
                e.value = r[1]
            }
            ))
        }
    }

    // Функция для обновления quiz-полей
    const m = (e, t) => {
        for (const a in t) {
            const n = t[a][0]
            const r = t[a][1];
            // Обновляем текст вопроса и ответ
            e.querySelectorAll(`.wpcf7-form-control-wrap[data-name="${a}"]`).forEach((e => {
                e.querySelector(`input[name="${a}"]`).value = "",
                    e.querySelector(".wpcf7-quiz-label").textContent = n,
                    e.querySelector(`input[name="_wpcf7_quiz_answer_ ${a}"]`).value = r
            }
            ))
        }
    }

    // Основная функция инициализации формы
    function w(e) {
        // Собираем данные формы
        const a = new FormData(e);
        // Инициализируем объект wpcf7 для формы
        e.wpcf7 = {
            id: t(a.get("_wpcf7")), // ID формы
            status: e.getAttribute("data-status"), // Текущий статус
            pluginVersion: a.get("_wpcf7_version"), // Версия плагина
            locale: a.get("_wpcf7_locale"), // Локаль
            unitTag: a.get("_wpcf7_unit_tag"), // Уникальный тег формы
            containerPost: t(a.get("_wpcf7_container_post")), // ID поста/страницы
            parent: e.closest(".wpcf7"), // Родительский элемент
            // Геттер для схемы валидации
            get schema() {
                return wpcf7.schemas.get(this.id)
            }
        },
            // Инициализируем схему валидации
            wpcf7.schemas.set(e.wpcf7.id, void 0),

            // Добавляем спиннеры для кнопок с классом has-spinner
            e.querySelectorAll(".has-spinner").forEach((e => {
                e.insertAdjacentHTML("afterend", '<span class="wpcf7-spinner"></span>')
            }
            )),

            // Инициализация exclusive checkbox (взаимоисключающих чекбоксов)
            (e => {
                e.querySelectorAll(".wpcf7-exclusive-checkbox").forEach((t => {
                    t.addEventListener("change", (t => {
                        const a = t.target.getAttribute("name");
                        // При выборе одного чекбокса снимаем выбор с остальных
                        e.querySelectorAll(`input[type="checkbox"][name="${a}"]`).forEach((e => {
                            e !== t.target && (e.checked = !1)
                        }
                        ))
                    }
                    ))
                }
                ))
            }
            )(e),

            // Инициализация полей с free-text (дополнительным текстовым полем)
            (e => {
                e.querySelectorAll(".has-free-text").forEach((t => {
                    const a = t.querySelector("input.wpcf7-free-text")
                    const n = t.querySelector('input[type="checkbox"], input[type="radio"]');
                    // Блокируем текстовое поле, если чекбокс/радио не выбрано
                    a.disabled = !n.checked,
                        e.addEventListener("change", (e => {
                            a.disabled = !n.checked,
                                e.target === n && n.checked && a.focus()
                        }
                        ))
                }
                ))
            }
            )(e),

            // Автоматическое добавление http:// к URL, если его нет
            (e => {
                e.querySelectorAll(".wpcf7-validates-as-url").forEach((e => {
                    e.addEventListener("change", (t => {
                        let a = e.value.trim();
                        a && !a.match(/^[a-z][a-z0-9.+-]*:/i) && -1 !== a.indexOf(".") && (a = a.replace(/^\/+/, ""),
                            a = "http://" + a),
                            e.value = a
                    }
                    ))
                }
                ))
            }
            )(e),

            // Обработка acceptance чекбоксов (согласия)
            (e => {
                if (!e.querySelector(".wpcf7-acceptance") || e.classList.contains("wpcf7-acceptance-as-validation"))
                    return;
                // Функция проверки состояния acceptance чекбоксов
                const t = () => {
                    let t = !0;
                    e.querySelectorAll(".wpcf7-acceptance").forEach((e => {
                        if (!t || e.classList.contains("optional"))
                            return;
                        const a = e.querySelector('input[type="checkbox"]');
                        (e.classList.contains("invert") && a.checked || !e.classList.contains("invert") && !a.checked) && (t = !1)
                    }
                    )),
                        // Блокируем кнопку отправки, если условия не выполнены
                        e.querySelectorAll(".wpcf7-submit").forEach((e => {
                            e.disabled = !t
                        }
                        ))
                }
                ;
                t(),
                    e.addEventListener("change", (e => {
                        t()
                    }
                    )),
                    e.addEventListener("wpcf7reset", (e => {
                        t()
                    }
                    ))
            }
            )(e),

            // Обработка счетчика символов
            (e => {
                // Функция обновления счетчика
                const a = (e, a) => {
                    const n = t(e.getAttribute("data-starting-value"))
                    const r = t(e.getAttribute("data-maximum-value"))
                    const c = t(e.getAttribute("data-minimum-value"))
                    // Вычисляем текущее количество символов
                    const o = e.classList.contains("down") ? n - a.value.trim().length : a.value.trim().length;
                    // Обновляем счетчик
                    e.setAttribute("data-current-value", o),
                        e.innerText = o,
                        // Проверяем ограничения
                        r && r < a.value.length ? e.classList.add("too-long") : e.classList.remove("too-long"),
                        c && a.value.length < c ? e.classList.add("too-short") : e.classList.remove("too-short")
                }
                // Функция инициализации счетчиков
                const n = t => {
                    t = {
                        init: !1,
                        ...t
                    },
                        e.querySelectorAll(".wpcf7-character-count").forEach((n => {
                            const r = n.getAttribute("data-target-name")
                            const c = e.querySelector(`[name="${r}"]`);
                            c && (c.value = c.defaultValue,
                                a(n, c),
                                t.init && c.addEventListener("keyup", (e => {
                                    a(n, c)
                                }
                                ))
                        }
                        ))
                }
                ;
                // Инициализация счетчиков
                n({
                    init: !0
                }),
                    // Сброс счетчиков при reset
                    e.addEventListener("wpcf7reset", (e => {
                        n()
                    }
                    ))
            }
            )(e),

            // Сброс формы при загрузке страницы, если есть кеширование
            window.addEventListener("load", (t => {
                wpcf7.cached && e.reset()
            }
            )),

            // Обработчик события reset
            e.addEventListener("reset", (t => {
                wpcf7.reset(e)
            }
            )),

            // Обработчик события submit
            e.addEventListener("submit", (t => {
                wpcf7.submit(e, {
                    submitter: t.submitter
                }),
                    t.preventDefault()
            }
            )),

            // Обновление капчи и quiz после отправки формы
            e.addEventListener("wpcf7submit", (t => {
                t.detail.apiResponse.captcha && u(e, t.detail.apiResponse.captcha),
                    t.detail.apiResponse.quiz && m(e, t.detail.apiResponse.quiz)
            }
            )),

            // Обновление капчи и quiz после сброса формы
            e.addEventListener("wpcf7reset", (t => {
                t.detail.apiResponse.captcha && u(e, t.detail.apiResponse.captcha),
                    t.detail.apiResponse.quiz && m(e, t.detail.apiResponse.quiz)
            }
            )),

            // Валидация при изменении поля
            e.addEventListener("change", (t => {
                t.target.closest(".wpcf7-form-control") && wpcf7.validate(e, {
                    target: t.target
                })
            }
            )),

            // Управление состоянием элементов при изменении статуса формы
            e.addEventListener("wpcf7statuschanged", (t => {
                const a = t.detail.status;
                // Активируем элементы с классом active-on-any
                e.querySelectorAll(".active-on-any").forEach((e => {
                    e.removeAttribute("inert"),
                        e.classList.remove("active-on-any")
                }
                )),
                    // Блокируем элементы, которые должны быть неактивны при текущем статусе
                    e.querySelectorAll(`.inert-on-${a}`).forEach((e => {
                        e.setAttribute("inert", "inert"),
                            e.classList.add("active-on-any")
                    }
                    ))
            }
            ))
    }

    // Инициализация при загрузке DOM
    document.addEventListener("DOMContentLoaded", (t => {
        var a;
        // Проверка необходимых условий
        if ("undefined" != typeof wpcf7)
            if (void 0 !== wpcf7.api)
                if ("function" == typeof window.fetch)
                    if ("function" == typeof window.FormData)
                        if ("function" == typeof NodeList.prototype.forEach)
                            if ("function" == typeof String.prototype.replaceAll) {
                                // Инициализация глобального объекта wpcf7
                                wpcf7 = {
                                    init: w,
                                    submit: p,
                                    reset: f,
                                    validate: o,
                                    schemas: new Map,
                                    ...null !== (a = wpcf7) && void 0 !== a ? a : {}
                                },
                                    // Проверка правильного размещения форм
                                    document.querySelectorAll("form .wpcf7[data-wpcf7-id]").forEach((t => {
                                        const a = document.createElement("p");
                                        a.setAttribute("class", "wpcf7-form-in-wrong-place");
                                        const n = document.createElement("strong");
                                        n.append((0,
                                            e.__)("Error:", "contact-form-7"));
                                        const r = (0,
                                            e.__)("This contact form is placed in the wrong place.", "contact-form-7");
                                        a.append(n, " ", r),
                                            t.replaceWith(a)
                                    }
                                    )),
                                    // Инициализация всех форм
                                    document.querySelectorAll(".wpcf7 > form").forEach((e => {
                                        wpcf7.init(e),
                                            e.closest(".wpcf7").classList.replace("no-js", "js")
                                    }
                                    ));
                                // Загрузка схем валидации для всех форм
                                for (const e of wpcf7.schemas.keys())
                                    r({
                                        endpoint: `contact-forms/${e}/feedback/schema`,
                                        method: "GET"
                                    }).then((t => {
                                        wpcf7.schemas.set(e, t)
                                    }
                                    ))
                            } else
                                console.error("Your browser does not support String.replaceAll().");
                        else
                            console.error("Your browser does not support NodeList.forEach().");
                    else
                        console.error("Your browser does not support window.FormData().");
                else
                    console.error("Your browser does not support window.fetch().");
            else
                console.error("wpcf7.api is not defined.");
        else
            console.error("wpcf7 is not defined.")
    }
    ))
}
)();
```