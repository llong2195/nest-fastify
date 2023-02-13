import * as notReallyCluster from 'cluster';
import { cpus } from 'os';

const cluster = notReallyCluster as unknown as notReallyCluster.Cluster;

/**
 * "If we're the primary process, fork a new process for each CPU core, otherwise run the bootstrap
 * function."
 *
 * The bootstrap function is the function that will be run in each process. It's the function that will
 * start the server
 * @param bootstrap - () => Promise<void>
 */
export function runInCluster(bootstrap: () => Promise<void>) {
    const numCPUs = cpus().length;

    if (cluster.isPrimary) {
        for (let i = 0; i < numCPUs; ++i) {
            cluster.fork();
        }
        cluster.on('exit', (worker, code, signal) => {
            console.log(`worker ${worker.process.pid} died`);
        });
    } else {
        bootstrap();
    }
}
