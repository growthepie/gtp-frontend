"use client";
import { useLabelsData } from "../useLabelsData";

export default function Page() {
  const { labels, loading, error } = useLabelsData();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }


  return (
    <div>
      <h1>Labels</h1>
      <table>
        <thead>
          <tr>
            <th>Label</th>
          </tr>
        </thead>
        <tbody>
          {labels.map((label) => (
            <tr key={`${label.address}-${label.origin_key}`}>
              <td>{JSON.stringify(label)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}