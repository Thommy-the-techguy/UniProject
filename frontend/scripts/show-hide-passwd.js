function show_hide_password(target) {
    let input = document.getElementById('password-input');

    if (input.getAttribute('type') == 'password') {
        target.classList.add('view');
        input.setAttribute('type', 'text');
    } else {
        target.classList.remove('view');
        input.setAttribute('type', 'password');
    }

    return false;
}

// module.exports = show_hide_password();