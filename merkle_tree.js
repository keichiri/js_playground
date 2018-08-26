const crypto = require("crypto");


// TODO - proof of consistency
function sha256(data) {
    let hasher = crypto.createHash('sha256');
    hasher.update(data, 'binary');
    return hasher.digest();
}

class Node {
    constructor(hash, leftChild, rightChild) {
        this.hash = hash;
        this.leftChild = leftChild;
        this.rightChild = rightChild;
    }

    copy() {
        return new Node(this.hash, null, null);
    }
}


class MerkleTree {
    constructor(root, leafCount) {
        this.root = root;
        this.leafCount = leafCount;
    }

    createProof(leafIndex) {
        let internalNodeCount = 2 ** Math.ceil(Math.log2(this.leafCount)) - 1;
        // index needs to start from 1 in order for this to work
        let nodeIndex = internalNodeCount + leafIndex + 1;

        let directions = [];
        while (nodeIndex >= 2) {
            let rem = nodeIndex % 2;
            directions.push(rem);
            nodeIndex = Math.floor(nodeIndex / 2);
        }
        directions.reverse();

        let proofHashes = [];
        let node = this.root;

        for (let direction of directions) {
            if (direction == 0) {
                let proofHash = Buffer.concat([node.rightChild.hash, Buffer.from("r")]);
                proofHashes.push(proofHash);
                node = node.leftChild;
            } else {
                let proofHash = Buffer.concat([node.leftChild.hash, Buffer.from("l")]);
                proofHashes.push(proofHash);
                node = node.rightChild;
            }
        }

        proofHashes.reverse();
        return proofHashes;
    }
}
MerkleTree.build = function(inputs) {
    let rootNode = MerkleTree.buildUp(inputs);
    return new MerkleTree(rootNode, inputs.length);
}

MerkleTree.buildUp = function(inputs) {
    let leafNodes = inputs
        .map(input => sha256(input + "\x00"))
        .map(inputHash => new Node(inputHash, null, null));
    return MerkleTree.buildNodesUp(leafNodes);
}

MerkleTree.buildNodesUp = function(nodes) {
    if (nodes.length == 1) return nodes[0];

    if (nodes.length % 2 == 1) {
        nodes.push(nodes[nodes.length-1].copy());
    }

    let parents = [];

    for (let i = 0; i <= nodes.length - 2; i += 2) {
        let leftChild = nodes[i];
        let rightChild = nodes[i+1];
        let parentHash = sha256(Buffer.concat([leftChild.hash, rightChild.hash, Buffer.from("\x01", "binary")]));
        let parent = new Node(parentHash, leftChild, rightChild);
        parents.push(parent);
    }

    return MerkleTree.buildNodesUp(parents);
}


let items = [
    "\x00\x00\x00\x00\x00",
    "\x01\x01\x01\x01\x01",
    "\x02\x02\x02\x02\x02",
    "\x03\x03\x03\x03\x03",
    "\x04\x04\x04\x04\x04"
];

let merkleTree = MerkleTree.build(items);
let proof = merkleTree.createProof(3).map(proofHash => Buffer.from(proofHash, "binary"));

console.log(proof);