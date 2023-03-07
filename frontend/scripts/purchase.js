if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
} else {
    ready();
}

function ready() {
    let purchaseButtons = document.querySelectorAll('button.card-btn');
    let purchaseButtonsItems = [].slice.call(purchaseButtons);
    
    purchaseButtonsItems.forEach(element => {
        element.addEventListener('click', purchaseClicked);
    });
}

let buttonId;

let stripeHandler = StripeCheckout.configure({
    key: stripePublicKey,
    locale: 'en',
    token: function(token) {
        let itemContainer = buttonId;
        let id = itemContainer.dataset.itemId;

        fetch('/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                stripeTokenId: token.id,
                items: id
            })
        }).then(function(res) {
            return res.json();
        }).then(function(data) {
            alert(data.message);
        }).catch(function(error) {
            console.log(error);
        })
    }
})

function purchaseClicked(event) {
    let productCard = event.target.parentElement.parentElement;
    let priceString = productCard.getElementsByClassName('price')[0].innerText;

    buttonId = productCard;

    let price = parseFloat(priceString.replace('$', '')) * 100;
    stripeHandler.open({
        amount: price
    })
}
