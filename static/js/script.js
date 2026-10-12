let products = [];
let currentProduct = null;


// Загружаем товары с сервера
async function loadProducts() {

    try {

        const response = await fetch("/api/products");

        if (!response.ok) {
            throw new Error("Ошибка загрузки товаров");
        }

        products = await response.json();

        renderProducts();

    } catch (error) {

        console.error(error);

        document.getElementById("products").innerHTML =
            "<p>Не удалось загрузить товары.</p>";
    }
}


// Создаём карточки товаров
function renderProducts() {

    const container = document.getElementById("products");

    container.innerHTML = "";

    products.forEach(product => {

        const card = document.createElement("div");

        card.className = "product-card";

        card.onclick = function () {
            openProduct(product.id);
        };


        // Картинка товара
        const image = document.createElement("img");

        image.className = "product-image";

        image.src = product.image_url;

        image.alt = product.title;

        image.onerror = function () {
            this.style.display = "none";
        };


        // Кнопка
        const button = document.createElement("button");

        button.textContent = product.reserved
            ? "ЗАБРОНИРОВАНО"
            : "ЗАБРОНИРОВАТЬ";


        button.onclick = function (event) {

            event.stopPropagation();

            openProduct(product.id);

        };


        card.appendChild(image);

        card.appendChild(button);

        container.appendChild(card);

    });
}


// Открываем товар
function openProduct(id) {

    currentProduct = id;

    const product = products.find(item => item.id === id);

    if (!product) {
        return;
    }


    // Картинка в окне товара
    const modalPlaceholder =
        document.getElementById("modalPlaceholder");

    modalPlaceholder.innerHTML = "";


    if (product.image_url) {

        const image = document.createElement("img");

        image.src = product.image_url;

        image.alt = product.title;

        image.className = "modal-image";

        modalPlaceholder.appendChild(image);

    }


    document.getElementById("modalTitle").textContent =
        product.title;

    document.getElementById("modalPrice").textContent =
        product.price;

    document.getElementById("modalDescription").textContent =
        product.description;

    document.getElementById("shopLink").href =
        product.shop_url;


    const reserveButton =
        document.querySelector(".reserve-button");


    if (product.reserved) {

        reserveButton.textContent = "ОТМЕНИТЬ БРОНЬ";

        reserveButton.disabled = false;

        reserveButton.onclick = cancelProduct;

    } else {

        reserveButton.textContent = "ЗАБРОНИРОВАТЬ";

        reserveButton.disabled = false;

        reserveButton.onclick = reserveProduct;

    }


    document
        .getElementById("productModal")
        .classList.add("active");
}


// Бронируем товар
async function reserveProduct() {

    if (!currentProduct) {
        return;
    }


    const button =
        document.querySelector(".reserve-button");

    button.disabled = true;

    button.textContent = "БРОНИРОВАНИЕ...";


    try {

        const response = await fetch(
            `/api/products/${currentProduct}/reserve`,
            {
                method: "POST"
            }
        );


        const data = await response.json();


        if (response.ok && data.success) {

            const product = products.find(
                item => item.id === currentProduct
            );

            product.reserved = true;


            button.textContent = "ОТМЕНИТЬ БРОНЬ";

            button.disabled = false;

            button.onclick = cancelProduct;


            renderProducts();

        } else {

            alert(
                "Этот товар уже забронировал другой пользователь."
            );

            await loadProducts();

        }


    } catch (error) {

        console.error(error);

        button.disabled = false;

        button.textContent = "ЗАБРОНИРОВАТЬ";

        button.onclick = reserveProduct;

        alert("Не удалось забронировать товар.");

    }

}


// Отменяем бронь
async function cancelProduct() {

    if (!currentProduct) {
        return;
    }


    const button =
        document.querySelector(".reserve-button");

    button.disabled = true;

    button.textContent = "ОТМЕНА...";


    try {

        const response = await fetch(
            `/api/products/${currentProduct}/cancel`,
            {
                method: "POST"
            }
        );


        const data = await response.json();


        if (response.ok && data.success) {

            const product = products.find(
                item => item.id === currentProduct
            );

            product.reserved = false;


            button.textContent = "ЗАБРОНИРОВАТЬ";

            button.disabled = false;

            button.onclick = reserveProduct;


            renderProducts();

        } else if (response.status === 403) {

            alert("Вы не можете отменить чужую бронь.");

            button.textContent = "ОТМЕНИТЬ БРОНЬ";

            button.disabled = false;

            button.onclick = cancelProduct;

        } else {

            alert("Товар уже свободен.");

            await loadProducts();

        }


    } catch (error) {

        console.error(error);

        button.disabled = false;

        button.textContent = "ОТМЕНИТЬ БРОНЬ";

        button.onclick = cancelProduct;

    }

}


// Закрываем окно
function closeProduct() {

    document
        .getElementById("productModal")
        .classList.remove("active");

}


// Закрытие окна при клике вне окна
window.onclick = function(event) {

    const modal =
        document.getElementById("productModal");

    if (event.target === modal) {
        closeProduct();
    }

};


// Загружаем товары при открытии страницы
loadProducts();