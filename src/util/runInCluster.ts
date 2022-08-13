import { cpus } from 'os';
import * as notReallyCluster from 'cluster';
const cluster = notReallyCluster as unknown as notReallyCluster.Cluster;

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
