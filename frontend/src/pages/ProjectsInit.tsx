import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Filter, Plus, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useState } from "react";

const allProjects = [
  {
    id: 1,
    name: "SAP S/4HANA Migration",
    sponsor: "John Smith",
    status: "In Progress",
    budget: "$125,000",
    startDate: "2025-08-15",
    endDate: "2025-12-31",
    completion: "65%",
    priority: "High",
    team: "Team Alpha",
  },
  {
    id: 2,
    name: "Fiori App Development",
    sponsor: "Sarah Johnson",
    status: "Planning",
    budget: "$75,000",
    startDate: "2025-10-01",
    endDate: "2026-02-28",
    completion: "20%",
    priority: "Medium",
    team: "Team Beta",
  },
  {
    id: 3,
    name: "Custom ABAP Reports",
    sponsor: "Michael Chen",
    status: "In Progress",
    budget: "$45,000",
    startDate: "2025-09-10",
    endDate: "2025-11-30",
    completion: "85%",
    priority: "High",
    team: "Team Alpha",
  },
  {
    id: 4,
    name: "Integration Suite Setup",
    sponsor: "Emily Davis",
    status: "Completed",
    budget: "$95,000",
    startDate: "2025-07-05",
    endDate: "2025-10-15",
    completion: "100%",
    priority: "Critical",
    team: "Team Gamma",
  },
  {
    id: 5,
    name: "Cloud Infrastructure",
    sponsor: "David Lee",
    status: "In Progress",
    budget: "$150,000",
    startDate: "2025-09-01",
    endDate: "2026-03-31",
    completion: "45%",
    priority: "Critical",
    team: "Team Delta",
  },
  {
    id: 6,
    name: "Data Migration",
    sponsor: "Lisa Wang",
    status: "Planning",
    budget: "$82,000",
    startDate: "2025-11-01",
    endDate: "2026-01-31",
    completion: "15%",
    priority: "Medium",
    team: "Team Beta",
  },
  {
    id: 7,
    name: "Security Audit",
    sponsor: "Robert Brown",
    status: "Completed",
    budget: "$35,000",
    startDate: "2025-06-15",
    endDate: "2025-09-30",
    completion: "100%",
    priority: "High",
    team: "Team Gamma",
  },
  {
    id: 8,
    name: "Mobile App Development",
    sponsor: "Amanda White",
    status: "In Progress",
    budget: "$98,000",
    startDate: "2025-08-20",
    endDate: "2026-01-15",
    completion: "55%",
    priority: "Medium",
    team: "Team Beta",
  },
  {
    id: 9,
    name: "API Gateway Implementation",
    sponsor: "Thomas Green",
    status: "Planning",
    budget: "$67,000",
    startDate: "2025-10-15",
    endDate: "2025-12-20",
    completion: "10%",
    priority: "Low",
    team: "Team Alpha",
  },
  {
    id: 10,
    name: "Analytics Dashboard",
    sponsor: "Jennifer Martinez",
    status: "In Progress",
    budget: "$54,000",
    startDate: "2025-09-25",
    endDate: "2025-11-25",
    completion: "70%",
    priority: "Medium",
    team: "Team Delta",
  },
];

export function ProjectsInit() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filter projects
  const filteredProjects = allProjects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.sponsor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (!sortColumn) return 0;

    const aValue = a[sortColumn as keyof typeof a];
    const bValue = b[sortColumn as keyof typeof b];

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Paginate projects
  const totalPages = Math.ceil(sortedProjects.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProjects = sortedProjects.slice(
    startIndex,
    startIndex + pageSize,
  );

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
        <Link to="/projects/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create new project
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All projects</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Planning">Planning</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-auto rounded-md border">
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="hover:bg-muted/50 bg-background sticky top-0 z-10 cursor-pointer"
                      onClick={() => handleSort("name")}
                    >
                      Project Name{" "}
                      {sortColumn === "name" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="hover:bg-muted/50 bg-background sticky top-0 z-10 cursor-pointer"
                      onClick={() => handleSort("sponsor")}
                    >
                      Sponsor{" "}
                      {sortColumn === "sponsor" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="hover:bg-muted/50 bg-background sticky top-0 z-10 cursor-pointer"
                      onClick={() => handleSort("team")}
                    >
                      Team{" "}
                      {sortColumn === "team" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="hover:bg-muted/50 bg-background sticky top-0 z-10 cursor-pointer"
                      onClick={() => handleSort("priority")}
                    >
                      Priority{" "}
                      {sortColumn === "priority" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="hover:bg-muted/50 bg-background sticky top-0 z-10 cursor-pointer"
                      onClick={() => handleSort("status")}
                    >
                      Status{" "}
                      {sortColumn === "status" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="hover:bg-muted/50 bg-background sticky top-0 z-10 cursor-pointer"
                      onClick={() => handleSort("budget")}
                    >
                      Budget{" "}
                      {sortColumn === "budget" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="hover:bg-muted/50 bg-background sticky top-0 z-10 cursor-pointer"
                      onClick={() => handleSort("startDate")}
                    >
                      Start Date{" "}
                      {sortColumn === "startDate" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="hover:bg-muted/50 bg-background sticky top-0 z-10 cursor-pointer"
                      onClick={() => handleSort("endDate")}
                    >
                      End Date{" "}
                      {sortColumn === "endDate" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="bg-background sticky top-0 z-10">
                      Completion
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProjects.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-muted-foreground py-8 text-center"
                      >
                        No projects found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="min-w-[200px] font-medium">
                          {project.name}
                        </TableCell>
                        <TableCell className="min-w-[150px]">
                          {project.sponsor}
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          {project.team}
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${
                              project.priority === "Critical"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                : project.priority === "High"
                                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                                  : project.priority === "Medium"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                            }`}
                          >
                            {project.priority}
                          </span>
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${
                              project.status === "Completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : project.status === "In Progress"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }`}
                          >
                            {project.status}
                          </span>
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          {project.budget}
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          {project.startDate}
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          {project.endDate}
                        </TableCell>
                        <TableCell className="min-w-[150px]">
                          <div className="flex items-center gap-2">
                            <div className="bg-muted h-2 max-w-[100px] flex-1 rounded-full">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: project.completion }}
                              />
                            </div>
                            <span className="text-muted-foreground text-sm">
                              {project.completion}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                Rows per page:
              </span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
