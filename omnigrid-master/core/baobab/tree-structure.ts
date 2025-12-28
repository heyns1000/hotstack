/**
 * BaobabTree™ Hierarchical Data Structure
 * Tree-based organization for OMNIGRID ecosystem
 */

export interface TreeNode {
  id: string;
  name: string;
  type: 'root' | 'branch' | 'leaf';
  parent?: string;
  children: string[];
  metadata: Record<string, any>;
  timestamp: number;
}

export class BaobabTree {
  private nodes: Map<string, TreeNode> = new Map();
  private rootId: string = 'root';

  constructor() {
    this.initializeTree();
  }

  /**
   * Initialize the OMNIGRID tree structure
   */
  private initializeTree(): void {
    // Root node
    this.addNode({
      id: 'root',
      name: 'OMNIGRID',
      type: 'root',
      children: [],
      metadata: {
        version: '2.0',
        totalBrands: 7102,
        createdAt: '2025-11-30'
      },
      timestamp: Date.now()
    });

    // Core services branch
    this.addNode({
      id: 'core',
      name: 'Core Services',
      type: 'branch',
      parent: 'root',
      children: [],
      metadata: { priority: 'critical' },
      timestamp: Date.now()
    });

    // Seedwave
    this.addNode({
      id: 'seedwave',
      name: 'Seedwave Admin Portal',
      type: 'leaf',
      parent: 'core',
      children: [],
      metadata: {
        subdomains: 12,
        status: 'active',
        url: 'seedwave.faa.zone'
      },
      timestamp: Date.now()
    });

    // VaultMesh
    this.addNode({
      id: 'vaultmesh',
      name: 'VaultMesh Security',
      type: 'leaf',
      parent: 'core',
      children: [],
      metadata: {
        encryption: 'AES-256',
        status: 'active'
      },
      timestamp: Date.now()
    });

    // NEXUS_NAIR
    this.addNode({
      id: 'nexus-nair',
      name: 'NEXUS_NAIR Pulse',
      type: 'leaf',
      parent: 'core',
      children: [],
      metadata: {
        currentPulse: 1247892,
        status: 'synchronized'
      },
      timestamp: Date.now()
    });

    // Portals branch
    this.addNode({
      id: 'portals',
      name: 'Portals',
      type: 'branch',
      parent: 'root',
      children: [],
      metadata: { count: 3 },
      timestamp: Date.now()
    });

    // HotStack
    this.addNode({
      id: 'hotstack',
      name: 'HotStack Landing',
      type: 'leaf',
      parent: 'portals',
      children: [],
      metadata: {
        url: 'hotstack.faa.zone',
        omnidropWindow: 180,
        status: 'live'
      },
      timestamp: Date.now()
    });

    // BushPortal
    this.addNode({
      id: 'bushportal',
      name: 'BushPortal',
      type: 'leaf',
      parent: 'portals',
      children: [],
      metadata: { status: 'active' },
      timestamp: Date.now()
    });

    // ScrollBinder
    this.addNode({
      id: 'scrollbinder',
      name: 'ScrollBinderOne',
      type: 'leaf',
      parent: 'portals',
      children: [],
      metadata: {
        engine: 'SB1AtomicScrollEngine',
        status: 'active'
      },
      timestamp: Date.now()
    });

    // Chess integration branch
    this.addNode({
      id: 'chess',
      name: 'Chess Integration',
      type: 'branch',
      parent: 'root',
      children: [],
      metadata: { engine: 'Luke' },
      timestamp: Date.now()
    });

    this.addNode({
      id: 'luke-engine',
      name: 'Luke Chess Engine',
      type: 'leaf',
      parent: 'chess',
      children: [],
      metadata: {
        opening: 'E4',
        status: 'active'
      },
      timestamp: Date.now()
    });
  }

  /**
   * Add a node to the tree
   */
  addNode(node: TreeNode): void {
    this.nodes.set(node.id, node);

    // Update parent's children array
    if (node.parent) {
      const parent = this.nodes.get(node.parent);
      if (parent && !parent.children.includes(node.id)) {
        parent.children.push(node.id);
      }
    }
  }

  /**
   * Get a node by ID
   */
  getNode(id: string): TreeNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get all children of a node
   */
  getChildren(id: string): TreeNode[] {
    const node = this.nodes.get(id);
    if (!node) return [];

    return node.children
      .map(childId => this.nodes.get(childId))
      .filter((child): child is TreeNode => child !== undefined);
  }

  /**
   * Get path from root to node
   */
  getPath(id: string): TreeNode[] {
    const path: TreeNode[] = [];
    let current = this.nodes.get(id);

    while (current) {
      path.unshift(current);
      current = current.parent ? this.nodes.get(current.parent) : undefined;
    }

    return path;
  }

  /**
   * Display tree structure as ASCII
   */
  displayTree(nodeId: string = 'root', indent: string = ''): string {
    const node = this.nodes.get(nodeId);
    if (!node) return '';

    let display = indent + '├─ ' + node.name;

    if (Object.keys(node.metadata).length > 0) {
      display += ` (${JSON.stringify(node.metadata).substring(0, 50)}...)`;
    }

    display += '\n';

    const children = this.getChildren(nodeId);
    for (let i = 0; i < children.length; i++) {
      const isLast = i === children.length - 1;
      const childIndent = indent + (isLast ? '   ' : '│  ');
      display += this.displayTree(children[i].id, childIndent);
    }

    return display;
  }

  /**
   * Get tree statistics
   */
  getStats(): {
    totalNodes: number;
    branches: number;
    leaves: number;
    maxDepth: number;
  } {
    let branches = 0;
    let leaves = 0;
    let maxDepth = 0;

    this.nodes.forEach(node => {
      if (node.type === 'branch') branches++;
      if (node.type === 'leaf') leaves++;

      const depth = this.getPath(node.id).length;
      if (depth > maxDepth) maxDepth = depth;
    });

    return {
      totalNodes: this.nodes.size,
      branches,
      leaves,
      maxDepth
    };
  }

  /**
   * Search nodes by metadata
   */
  search(query: Record<string, any>): TreeNode[] {
    const results: TreeNode[] = [];

    this.nodes.forEach(node => {
      let matches = true;

      for (const [key, value] of Object.entries(query)) {
        if (node.metadata[key] !== value) {
          matches = false;
          break;
        }
      }

      if (matches) {
        results.push(node);
      }
    });

    return results;
  }

  /**
   * Export tree as JSON
   */
  export(): Record<string, TreeNode> {
    const exported: Record<string, TreeNode> = {};

    this.nodes.forEach((node, id) => {
      exported[id] = node;
    });

    return exported;
  }
}

// Export singleton instance
export const baobabTree = new BaobabTree();

// Example usage
if (require.main === module) {
  console.log('🌳 BaobabTree initialized');
  console.log('\nTree structure:');
  console.log(baobabTree.displayTree());
  console.log('\nStatistics:', baobabTree.getStats());
  console.log('\nActive services:', baobabTree.search({ status: 'active' }));
}
