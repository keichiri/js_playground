class Node {
    constructor(item) {
        this.item = item;
        this.value = null;
        this.nextSibling = null;
        this.firstChild = null;
    }

    setValue(value) {
        this.value = value;
    }

    removeValue() {
        this.value = null;
    }

    getValue() {
        return this.value;
    }

    hasValue() {
        return this.value != null;
    }

    hasChild() {
        return this.firstChild != null;
    }

    getChild(item) {
        if (!this.firstChild) {
            return null;
        }

        let child = this.firstChild;
        while (child) {
            if (child.item === item) {
                return child;
            }

            child = child.nextSibling;
        }

        return null;
    }

    addChild(item) {
        let newChild = new Node(item);
        if (!this.firstChild) {
            this.firstChild = newChild;
            return newChild;
        }

        let sibling = this.firstChild;
        while (sibling.nextSibling) {
            sibling = sibling.nextSibling;
        }

        sibling.nextSibling = newChild;
        return newChild;
    }

    removeChild(item) {
        if (!this.firstChild) {
            throw new Error("No child for item: " + item);
        }

        if (this.firstChild.item === item) {
            this.firstChild = this.firstChild.nextSibling;
            return;
        }

        let child = this.firstChild;
        while (child.nextSibling) {
            if (child.nextSibling.item === item) {
                child.nextSibling = child.nextSibling.nextSibling;
                return;
            }

            child = child.nextSibling;
        }

        throw new Error("No child for item: " + item);
    }

    *gen(prefix) {
        if (this.item) {
            prefix += this.item;
        }

        if (this.value) {
            yield [prefix, this.value];
        }

        let child = this.firstChild;
        while (child) {
            yield* child.gen(prefix);
            child = child.nextSibling;
        }
    }
}


class Trie {
    constructor() {
        this.size = 0;
        this.nodeCount = 0;
        this.root = new Node(null);
    }

    set(key, value) {
        let pathItems = key.split("");
        let node = this.root;

        for (let pathItem of pathItems) {
            let child = node.getChild(pathItem);
            if (!child) {
                this.nodeCount += 1;
                child = node.addChild(pathItem);
            }

            node = child;
        }

        if (!node.value) this.size += 1;
        node.setValue(value);
    }

    getSize() {
        return this.size;
    }

    get(key) {
        let pathItems = key.split("");
        let node = this.root;

        for (let pathItem of pathItems) {
            node = node.getChild(pathItem);
            if (!node) {
                return null;
            }
        }

        return node.value;
    }

    remove(key) {
        let nodes = [this.root];
        let pathItems = key.split("");
        let node = this.root;

        for (let pathItem of pathItems) {
            node = node.getChild(pathItem);
            if (!node) {
                throw new Error("No such key: " + key);
            }

            nodes.push(node);
        }

        if (!node.getValue()) {
            throw new Error("No such value: " + key);
        }
        node.setValue(null);
        this.size -= 1;
        if (node.hasChild()) {
            return;
        }

        let parents = nodes.slice(0, nodes.length - 1);

        for (let i = parents.length - 1; i >= 0; i--) {
            let parent = parents[i];
            let pathItem = pathItems[i];
            parent.removeChild(pathItem);
            this.nodeCount -= 1;
            if (parent.hasChild() || parent.hasValue()) {
                break;
            }
        }
    }

    *allValues() {
        yield* this.root.gen("");
    }
}


const assert = require('assert');
const fs = require('fs');

function testTrie() {
    let fileContent = fs.readFileSync("/usr/share/dict/words").toString();
    let words = fileContent.split("\n").map(x => x.trim()).filter(x => x.length > 0);
    shuffle(words);

    let index = Math.floor(words.length / 20);
    let notAdded = words.slice(0, index);
    let toAdd = words.slice(index);

    let trie = new Trie();

    for (let word of toAdd) {
        trie.set(word, byteSum(word));
    }

    assert.equal(trie.getSize(), toAdd.length);

    for (let word of toAdd) {
        let value = trie.get(word);
        assert.equal(value, byteSum(word));
    }

    for (let word of notAdded) {
        assert.equal(trie.get(word), null);
    }

    let toRemoveCount = Math.floor(toAdd.length / 5);
    let wordsToRemove = toAdd.slice(0, toRemoveCount);
    let left = toAdd.slice(toRemoveCount);

    for (let word of wordsToRemove) {
        trie.remove(word);
    }

    assert.equal(trie.getSize(), left.length);

    for (let word of left) {
        assert.equal(trie.get(word), byteSum(word));
    }
    console.log("Sorting")

    let expectedContent = left.map(word => [word, byteSum(word)]).reduce((acc, [k, v]) => acc.set(k, v), new Map());
    let retrievedContent = new Map();
    for (let item of trie.allValues()) {
        retrievedContent.set(item[0], item[1]);
    }
    console.log("Sorting");

    assert.equal(expectedContent.length, retrievedContent.length);
    console.log(`first: ${expectedContent[0]}`);
    console.log(`second: ${retrievedContent[0]}`);

    for (let [k, v] of expectedContent) {
        assert.equal(v, retrievedContent.get(k));
    }
}


function shuffle(array) {
    // Note - not seeding random generator
    let counter = array.length;

    while (counter > 0) {
        let index = Math.floor(Math.random() * counter);
        counter--;

        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }
}

function byteSum(word) {
    let sum = 0;
    for (let i = 0; i < word.length; i++) {
        sum += word.charCodeAt(i);
    }
    return sum;
}


testTrie();