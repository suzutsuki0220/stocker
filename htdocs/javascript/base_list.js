function baseCard(dirs) {
    let cards = new Array();

    for (let i=0; i<dirs.length; i++) {
        let a = document.createElement('a');
        a.href = "javascript:stocker.components.backToList('" + dirs[i].encoded + "', '')";
        const image = '<img src="icons/devices/drive-harddisk.png" alt="Placeholder image">';
        render.bulma.layout.mediaObject(a, image, dirs[i].name);

        cards.push({content: a.outerHTML});
    }

    return render.bulma.components.card(cards);
}

window.addEventListener("load", function(event) {
    getRootDirectories(function(directory) {
        document.getElementById('base_list').appendChild(baseCard(directory));
    });
});
