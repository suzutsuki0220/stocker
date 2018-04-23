// 引数で指定された名前のノードを返す
// getElementsByTagName()とは違い、再帰的な検索は行わない
function getXmlFirstFindChildNode(elem, name)
{
    if (elem == null) {
        return null;
    }

    if (elem.childNodes == null) {
        return null;
    }

    for (var i=0; i<elem.childNodes.length; i++) {
        if (elem.childNodes.item(i).nodeName === name) {
            return elem.childNodes.item(i);
        }
    }

    return null;
}

// 引数で指定されたchildNodesから最初に見つかったnameのデータを取得する
// 再帰的な検索と、同名のタグを検索しないためデータが増えたときに重くなりにくい
function getXmlFirstFindTagData(elements, name)
{
    if (elements == null) {
        return "";
    }

    if (elements.length) {
        for (var i=0; i<elements.length; i++) {
            if (elements.item(i).tagName === name) {
                return elements.item(i).textContent;
            }
        }
    }

    return "";
}
