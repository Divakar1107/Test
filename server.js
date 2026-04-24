const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/bfhl', (req, res) => {
    const input = req.body.data || [];

    let invalid_entries = [];
    let duplicate_edges = [];
    let seen = new Set();
    let edges = [];

    // STEP 1: Validate + duplicates
    for (let item of input) {
        item = item.trim();

        if (!/^[A-Z]->[A-Z]$/.test(item) || item[0] === item[3]) {
            invalid_entries.push(item);
            continue;
        }

        if (seen.has(item)) {
            if (!duplicate_edges.includes(item)) {
                duplicate_edges.push(item);
            }
            continue;
        }

        seen.add(item);
        edges.push(item);
    }

    // STEP 2: Build graph
    let graph = {};
    let childrenSet = new Set();

    edges.forEach(e => {
        let [p, c] = e.split('->');
        if (!graph[p]) graph[p] = [];
        graph[p].push(c);
        childrenSet.add(c);
    });

    // STEP 3: Find roots
    let roots = Object.keys(graph).filter(node => !childrenSet.has(node));

    // STEP 4: DFS for tree + cycle
    function buildTree(node, visited, path) {
        if (path.has(node)) return { cycle: true };

        path.add(node);

        let tree = {};
        let maxDepth = 1;

        if (graph[node]) {
            for (let child of graph[node]) {
                let result = buildTree(child, visited, new Set(path));

                if (result.cycle) return { cycle: true };

                tree[child] = result.tree;
                maxDepth = Math.max(maxDepth, 1 + result.depth);
            }
        }

        return { tree, depth: maxDepth };
    }

    let hierarchies = [];
    let total_trees = 0;
    let total_cycles = 0;
    let maxDepth = 0;
    let largest_tree_root = "";

    // STEP 5: Process each root
    for (let root of roots) {
        let result = buildTree(root, new Set(), new Set());

        if (result.cycle) {
            total_cycles++;
            hierarchies.push({
                root,
                tree: {},
                has_cycle: true
            });
        } else {
            total_trees++;
            hierarchies.push({
                root,
                tree: { [root]: result.tree },
                depth: result.depth
            });

            if (result.depth > maxDepth) {
                maxDepth = result.depth;
                largest_tree_root = root;
            }
        }
    }

    res.json({
        user_id: "yourname_ddmmyyyy",
        email_id: "yourcollege@email.com",
        college_roll_number: "yourrollno",
        hierarchies,
        invalid_entries,
        duplicate_edges,
        summary: {
            total_trees,
            total_cycles,
            largest_tree_root
        }
    });
});

app.listen(3000, () => console.log("Server running"));