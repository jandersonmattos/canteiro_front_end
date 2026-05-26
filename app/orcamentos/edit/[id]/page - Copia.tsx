"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Sidebar from "../../../../components/Sidebar";
import {
  ArrowLeft,
  Save,
  ChevronRight,
  Building2,
  FileText,
  Calculator,
  FolderKanban,
  Search,
  Plus,
  Check,
  Database,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type ServiceNode = {
  id?: string;
  code?: string;
  description?: string;
  unit?: string | null;
  total_cost?: number;
  children?: ServiceNode[];
};

type ServiceItem = {
  id: string;
  code: string;
  description: string;
  unit: string;
  total_cost: number;
  category: string;
};

type SelectedServiceConfig = {
  quantity: number;
  baseValue: number;
  bdiPercentage: number;
};

type ProjectOption = {
  id: string;
  nome: string;
  proprietario?: string;
  endereco?: string;
  categoria?: string;
  status?: string;
};

type ScheduleTaskConfig = {
  startDate: string; // YYYY-MM-DD
  duration: number; // dias
};

type ScheduleTask = {
  id: string;
  name: string;
  category: string;
  isParent: boolean;
  parentCategory?: string;
  children?: string[]; // IDs dos filhos
  config?: ScheduleTaskConfig;
  calculatedStartDate?: string;
  calculatedEndDate?: string;
};

type BudgetItem = {
  id: string;
  parent_item_id: string | null;
  item_order: number;
  item_code: string;
  description: string;
  unit: string;
  quantity: number;
  unit_cost: number;
  bdi_percentage: number;
  sale_price: number;
  total_cost: number;
  total_sale: number;
  service_id: string | null;
};

type BudgetData = {
  id: string;
  number: string;
  type: string;
  client_name: string;
  project_name: string;
  status: string;
  total_cost: number;
  total_sale: number;
  created_at: string;
  updated_at: string;
  items: BudgetItem[];
};

function formatCurrencyBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
}

function parseCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return 0;
  }

  return Number(digits) / 100;
}

const ProjectAutocomplete = ({
  label,
  value,
  selectedProject,
  options,
  open,
  loading,
  onFocus,
  onBlur,
  onSearchChange,
  onSelect,
}: any) => {
  return (
    <div className="relative">
      <label className="block text-sm text-zinc-400 mb-2">{label}</label>

      <input
        value={value}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Pesquise e selecione uma obra"
        className="
          w-full
          h-14
          rounded-2xl
          border
          border-white/10
          bg-black/40
          px-4
          outline-none
          focus:border-emerald-500/40
        "
      />

      {selectedProject && (
        <p className="mt-2 text-xs text-zinc-500">
          Selecionada: <span className="text-zinc-300">{selectedProject.nome}</span>
        </p>
      )}

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/40">
          <div className="max-h-72 overflow-auto">
            {loading ? (
              <div className="px-4 py-4 text-sm text-zinc-400">
                Carregando obras...
              </div>
            ) : options.length === 0 ? (
              <div className="px-4 py-4 text-sm text-zinc-500">
                Nenhuma obra encontrada
              </div>
            ) : (
              options.map((project: ProjectOption) => (
                <button
                  key={project.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelect(project)}
                  className="
                    w-full
                    text-left
                    px-4
                    py-3
                    border-b
                    border-white/5
                    hover:bg-white/[0.04]
                    transition-colors
                  "
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{project.nome}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {project.proprietario || "Sem proprietário"}
                      </p>
                    </div>

                    <div className="text-right text-xs text-zinc-500">
                      {project.categoria ? <p>{project.categoria}</p> : null}
                      {project.status ? <p>{project.status}</p> : null}
                    </div>
                  </div>

                  {project.endereco && (
                    <p className="mt-2 text-xs text-zinc-600">{project.endereco}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function flattenTreeServices(
  nodes: ServiceNode[],
  parentCategory?: string
): ServiceItem[] {
  const result: ServiceItem[] = [];

  for (const node of nodes) {
    const currentCategory =
      parentCategory ?? (node.description || "Sem categoria");
    const children = Array.isArray(node.children) ? node.children : [];

    if (children.length > 0) {
      result.push(...flattenTreeServices(children, currentCategory));
      continue;
    }

    result.push({
      id: node.id || `${node.code || ""}-${node.description || ""}`,
      code: node.code || "-",
      description: node.description || "Sem descricao",
      unit: node.unit || "-",
      total_cost: Number(node.total_cost || 0),
      category: currentCategory,
    });
  }

  return result;
}

function parseServicesResponse(data: any): {
  services: ServiceItem[];
  categories: string[];
} {
  const tree = Array.isArray(data?.tree) ? data.tree : [];

  if (tree.length > 0) {
    const categories = tree
      .map((node: ServiceNode) => node.description)
      .filter((value: string | undefined): value is string => Boolean(value));

    return {
      services: flattenTreeServices(tree),
      categories,
    };
  }

  const fallbackList = Array.isArray(data)
    ? data
    : Array.isArray(data?.services)
    ? data.services
    : Array.isArray(data?.data)
    ? data.data
    : [];

  const services: ServiceItem[] = fallbackList.map(
    (item: any, index: number) => ({
      id: item.id || `${item.code || "item"}-${index}`,
      code: item.code || "-",
      description: item.description || "Sem descricao",
      unit: item.unit || "-",
      total_cost: Number(item.total_cost || 0),
      category: item.category || "Sem categoria",
    })
  );

  const categories = Array.from(
    new Set(services.map((service) => service.category))
  );

  return { services, categories };
}

export default function EditBudgetPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const budgetId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [budgetCreated, setBudgetCreated] = useState(false);
  const [activeTab, setActiveTab] = useState("dados");

  const [form, setForm] = useState({
    numero: "",
    obra: "",
    tipo: "",
    nome: "",
    observacoes: "",
    tabela: "",
  });

  const [selectedServices, setSelectedServices] = useState<
    Record<string, SelectedServiceConfig>
  >({});

  const [scheduleTasks, setScheduleTasks] = useState<Record<string, ScheduleTaskConfig>>({});

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectOpen, setProjectOpen] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const tabelas = [
    {
      id: "sinapi",
      nome: "SINAPI",
      descricao: "Tabela nacional da Caixa Econômica Federal",
      badge: "Mais utilizado",
    },
    {
      id: "sicro",
      nome: "SICRO",
      descricao: "Infraestrutura e obras rodoviárias",
      badge: null,
    },
    {
      id: "seinfra",
      nome: "SEINFRA",
      descricao: "Tabela de referência estadual",
      badge: null,
    },
    {
      id: "orse",
      nome: "ORSE",
      descricao: "Orçamentos de Sergipe",
      badge: null,
    },
    {
      id: "setop",
      nome: "SETOP",
      descricao: "Custos referenciais SETOP",
      badge: null,
    },
    {
      id: "sudecap",
      nome: "SUDECAP",
      descricao: "Tabela SUDECAP Belo Horizonte",
      badge: null,
    },
    {
      id: "agetop",
      nome: "AGETOP",
      descricao: "Tabela de obras públicas",
      badge: null,
    },
    {
      id: "deres",
      nome: "DER-ES",
      descricao: "Departamento de Estradas ES",
      badge: null,
    },
    {
      id: "edif",
      nome: "EDIF",
      descricao: "Edificações e composições",
      badge: null,
    },
    {
      id: "seilpred",
      nome: "SEIL-PRED",
      descricao: "Predial e infraestrutura",
      badge: null,
    },
    {
      id: "inteligente",
      nome: "Biblioteca inteligente",
      descricao: "Serviços próprios e predefinidos pelo sistema",
      badge: "Mais rápido",
    },
  ];

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [loadingServices, setLoadingServices] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === form.obra) || null,
    [projects, form.obra]
  );

  const filteredProjects = useMemo(() => {
    const search = projectSearch.trim().toLowerCase();

    if (!search) {
      return projects.slice(0, 8);
    }

    return projects
      .filter((project) => {
        return [
          project.nome,
          project.proprietario,
          project.endereco,
          project.categoria,
          project.status,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(search));
      })
      .slice(0, 8);
  }, [projects, projectSearch]);

  // Carregar budget
  useEffect(() => {
    async function loadBudget() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/budgets/${budgetId}`
        );

        if (!response.ok) {
          throw new Error("Orçamento não encontrado");
        }

        const budgetData: BudgetData = await response.json();

        // Preencher form
        setForm((prev) => ({
          ...prev,
          numero: budgetData.number || "",
          tipo: budgetData.type || "",
          nome: budgetData.project_name || "",
          observacoes: "",
          tabela: "inteligente", // Por enquanto, assumir que vem de biblioteca inteligente
        }));

        // Reconstruir selectedServices do array de items
        const reconstructedServices: Record<string, SelectedServiceConfig> = {};
        budgetData.items.forEach((item) => {
          if (item.service_id) {
            reconstructedServices[item.service_id] = {
              quantity: item.quantity,
              baseValue: item.unit_cost,
              bdiPercentage: item.bdi_percentage,
            };
          }
        });
        setSelectedServices(reconstructedServices);

        // Marcar que conteúdo foi carregado
        setBudgetCreated(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao carregar orçamento";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }

    loadBudget();
  }, [budgetId]);

  // Carregar projetos
  useEffect(() => {
    async function loadProjects() {
      try {
        setLoadingProjects(true);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects`
        );

        if (!response.ok) {
          throw new Error("Erro ao carregar obras");
        }

        const data = await response.json();

        const formatted = Array.isArray(data)
          ? data.map((item: any) => ({
              id: String(item.id),
              nome: item.nome || "Sem nome",
              proprietario: item.proprietario,
              endereco: `${item.cidade || ""} - ${item.estado || ""}`.trim(),
              categoria: item.categoria,
              status: item.status || "Planejamento",
            }))
          : [];

        setProjects(formatted);

        // Tentar encontrar o projeto correspondente
        if (budgetCreated && formatted.length > 0) {
          const matchedProject = formatted.find(
            (p: ProjectOption) =>
              p.proprietario?.toLowerCase() ===
                form.observacoes.toLowerCase() &&
              p.nome?.toLowerCase() === form.nome.toLowerCase()
          );

          if (matchedProject) {
            setForm((prev) => ({
              ...prev,
              obra: matchedProject.id,
            }));
            setProjectSearch(matchedProject.nome);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar obras", error);
        toast.error("Erro ao carregar obras");
      } finally {
        setLoadingProjects(false);
      }
    }

    loadProjects();
  }, []);

  // Carregar serviços
  useEffect(() => {
    async function loadServices() {
      if (!form.tabela) {
        setServices([]);
        setCategories([]);
        setSelectedCategory("");
        setServiceSearch("");
        return;
      }

      try {
        setLoadingServices(true);

        const versionMap: any = {
          sinapi: "UUID_DA_VERSAO_SINAPI",
          sicro: "UUID_DA_VERSAO_SICRO",
          inteligente: "22222222-2222-2222-2222-222222222222",
        };

        const versionId = versionMap[form.tabela];

        if (!versionId) {
          setServices([]);
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/cost-bases/${versionId}/services`
        );

        const data = await response.json();

        const parsed = parseServicesResponse(data);

        setServices(parsed.services);
        setCategories(parsed.categories);
        setSelectedCategory(parsed.categories[0] || "");
        setServiceSearch("");
      } catch (error) {
        console.error("Erro ao carregar serviços:", error);
      } finally {
        setLoadingServices(false);
      }
    }

    loadServices();
  }, [form.tabela]);

  const filteredServices = useMemo(() => {
    return services.filter((item) => {
      const matchesCategory =
        !selectedCategory || item.category === selectedCategory;

      const search = serviceSearch.trim().toLowerCase();
      const matchesSearch =
        search.length === 0 ||
        item.description.toLowerCase().includes(search) ||
        item.code.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [services, selectedCategory, serviceSearch]);

  const selectedCount = useMemo(
    () => Object.keys(selectedServices).length,
    [selectedServices]
  );

  const selectedTotal = useMemo(() => {
    return services.reduce((sum, service) => {
      const config = selectedServices[service.id];
      if (!config) {
        return sum;
      }

      return sum + config.quantity * config.baseValue;
    }, 0);
  }, [services, selectedServices]);

  const selectedSaleTotal = useMemo(() => {
    return services.reduce((sum, service) => {
      const config = selectedServices[service.id];
      if (!config) {
        return sum;
      }

      const saleUnitCost =
        config.baseValue * (1 + (config.bdiPercentage || 0) / 100);

      return sum + config.quantity * saleUnitCost;
    }, 0);
  }, [services, selectedServices]);

  function toggleService(service: ServiceItem) {
    setSelectedServices((prev) => {
      if (prev[service.id]) {
        const next = { ...prev };
        delete next[service.id];
        return next;
      }

      return {
        ...prev,
        [service.id]: {
          quantity: 1,
          baseValue: service.total_cost,
          bdiPercentage: 25,
        },
      };
    });
  }

  function updateServiceQuantity(service: ServiceItem, value: number) {
    const quantity = Number.isFinite(value) && value > 0 ? value : 1;

    setSelectedServices((prev) => ({
      ...prev,
      [service.id]: {
        quantity,
        baseValue: prev[service.id]?.baseValue ?? service.total_cost,
        bdiPercentage: prev[service.id]?.bdiPercentage ?? 25,
      },
    }));
  }

  function updateServiceBaseValue(service: ServiceItem, value: number) {
    const baseValue = Number.isFinite(value) && value >= 0 ? value : 0;

    setSelectedServices((prev) => ({
      ...prev,
      [service.id]: {
        quantity: prev[service.id]?.quantity ?? 1,
        baseValue,
        bdiPercentage: prev[service.id]?.bdiPercentage ?? 25,
      },
    }));
  }

  function updateServiceBdiPercentage(service: ServiceItem, value: number) {
    const bdiPercentage = Number.isFinite(value) && value >= 0 ? value : 0;

    setSelectedServices((prev) => ({
      ...prev,
      [service.id]: {
        quantity: prev[service.id]?.quantity ?? 1,
        baseValue: prev[service.id]?.baseValue ?? service.total_cost,
        bdiPercentage,
      },
    }));
  }

  function selectAllVisibleServices() {
    setSelectedServices((prev) => {
      const next = { ...prev };

      filteredServices.forEach((service) => {
        if (!next[service.id]) {
          next[service.id] = {
            quantity: 1,
            baseValue: service.total_cost,
            bdiPercentage: 25,
          };
        }
      });

      return next;
    });
  }

  function clearSelection() {
    setSelectedServices({});
  }

  const selectedServicesList = useMemo(() => {
    return services
      .map((service) => {
        const selected = selectedServices[service.id];
        if (!selected) {
          return null;
        }

        return {
          service,
          config: selected,
        };
      })
      .filter(
        (
          item
        ): item is {
          service: ServiceItem;
          config: SelectedServiceConfig;
        } => Boolean(item)
      );
  }, [services, selectedServices]);

  async function handleUpdateBudget() {
    if (!form.numero.trim()) {
      toast.error("Informe o número do orçamento");
      return;
    }

    if (!form.obra) {
      toast.error("Selecione uma obra");
      return;
    }

    if (!form.tipo) {
      toast.error("Selecione o tipo de orçamento");
      return;
    }

    if (selectedServicesList.length === 0) {
      toast.error("Selecione pelo menos 1 serviço");
      return;
    }

    const payload = {
      number: form.numero.trim(),
      type: form.tipo,
      client_name:
        selectedProject?.proprietario?.trim() || "Cliente não informado",
      project_name:
        form.nome.trim() || selectedProject?.nome || "Projeto sem nome",
      items: selectedServicesList.map(({ service, config }, index) => ({
        item_order: index + 1,
        item_code: service.code,
        description: service.description,
        unit: service.unit,
        quantity: config.quantity,
        unit_cost: config.baseValue,
        bdi_percentage: config.bdiPercentage,
        service_id: service.id,
      })),
    };

    try {
      setSavingBudget(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/budgets/${budgetId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        const detailMessage =
          responseData && typeof responseData.detail === "string"
            ? responseData.detail
            : "Não foi possível atualizar o orçamento";

        throw new Error(detailMessage);
      }

      toast.success("Orçamento atualizado com sucesso");
      router.push("/orcamentos");
    } catch (error) {
      console.error("Erro ao atualizar orçamento:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar orçamento"
      );
    } finally {
      setSavingBudget(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <Calculator size={28} className="text-emerald-400 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Carregando orçamento...</h2>
            <p className="text-zinc-400">Aguarde enquanto buscamos os dados</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
              <FileText size={28} className="text-red-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Erro ao carregar</h2>
            <p className="text-zinc-400 mb-6">{error}</p>
            <Link
              href="/orcamentos"
              className="inline-block h-12 px-6 rounded-2xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-all"
            >
              Voltar para orçamentos
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        {/* HEADER */}
        <div
          className="
            border-b
            border-white/10
            bg-black/70
            backdrop-blur-xl
            sticky
            top-0
            z-40
          "
        >
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <Link
                  href="/orcamentos"
                  className="
                    w-12
                    h-12
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.03]
                    flex
                    items-center
                    justify-center
                    hover:bg-white/[0.06]
                    transition-all
                  "
                >
                  <ArrowLeft size={18} />
                </Link>

                <div>
                  <h1 className="text-4xl font-bold mb-2">Editar orçamento</h1>

                  <p className="text-zinc-400">
                    {form.numero || "Carregando..."}
                  </p>
                </div>
              </div>

              <button
                onClick={handleUpdateBudget}
                disabled={savingBudget}
                className="
                  h-12
                  px-6
                  rounded-2xl
                  bg-emerald-500
                  text-black
                  font-semibold
                  flex
                  items-center
                  gap-3
                  hover:bg-emerald-400
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                  transition-all
                "
              >
                <Save size={18} />
                {savingBudget ? "Atualizando..." : "Atualizar orçamento"}
              </button>
            </div>
          </div>
        </div>

        {/* SUB NAVIGATION */}
        {budgetCreated && (
          <div
            className="
                sticky
                top-[89px]
                z-30
                border-b
                border-white/10
                bg-black/80
                backdrop-blur-xl
            "
          >
            <div className="px-8">
              <div
                className="
                    max-w-7xl
                    mx-auto
                    flex
                    items-center
                    gap-2
                    overflow-x-auto
                    py-4
                "
              >
                {[
                  {
                    id: "dados",
                    label: "Dados gerais",
                  },
                  {
                    id: "custos",
                    label: "Custos",
                  },
                  {
                    id: "venda",
                    label: "Venda",
                  },
                  {
                    id: "servicos",
                    label: "Serviços",
                  },
                  {
                    id: "insumos",
                    label: "Insumos",
                  },
                  {
                    id: "curva",
                    label: "Análise financeira",
                  },
                  {
                    id: "cronograma",
                    label: "Cronograma",
                  },
                  {
                    id: "fisico",
                    label: "Planejamento físico",
                  },
                  {
                    id: "medicao",
                    label: "Medições",
                  },
                  {
                    id: "realizado",
                    label: "Previsto x Realizado",
                  },
                ].map((tab) => {
                  const active = tab.id === activeTab;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        whitespace-nowrap
                        h-12
                        px-5
                        rounded-2xl
                        text-sm
                        font-medium
                        transition-all
                        border
                        ${
                          active
                            ? `
                                bg-emerald-500
                                border-emerald-500
                                text-black
                            `
                            : `
                                bg-white/[0.03]
                                border-white/10
                                text-zinc-400
                                hover:text-white
                                hover:border-white/20
                            `
                        }
                        `}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CONTENT */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* RENDERIZAR CONTEÚDO BASEADO NA ABA ATIVA */}
            {activeTab === "dados" && (
              <>
            {/* HERO */}
            <div
              className="
                relative
                overflow-hidden
                rounded-[32px]
                border
                border-white/10
                bg-gradient-to-br
                from-emerald-500/10
                via-white/[0.03]
                to-white/[0.02]
                p-8
                mb-8
              "
            >
              <div
                className="
                  absolute
                  top-0
                  right-0
                  w-96
                  h-96
                  bg-emerald-500/10
                  blur-3xl
                  rounded-full
                "
              />

              <div className="relative z-10">
                <div
                  className="
                    w-16
                    h-16
                    rounded-3xl
                    bg-emerald-500/15
                    border
                    border-emerald-500/20
                    flex
                    items-center
                    justify-center
                    mb-6
                  "
                >
                  <Calculator size={30} className="text-emerald-400" />
                </div>

                <h2 className="text-3xl font-bold mb-4">
                  Editar orçamento em 3 etapas
                </h2>

                <p className="text-zinc-400 max-w-3xl leading-relaxed">
                  Atualize os dados, origem dos serviços e composição financeira do orçamento.
                </p>
              </div>
            </div>

            {/* INFO STRIP */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              <InfoCard
                icon={<Building2 size={24} className="text-blue-400" />}
                title="Obra vinculada"
                description="
                  O orçamento ficará conectado à obra,
                  permitindo gestão financeira e medições.
                "
              />

              <InfoCard
                icon={<Sparkles size={24} className="text-purple-400" />}
                title="Biblioteca inteligente"
                description="
                  Use serviços próprios do sistema sem depender
                  de tabelas oficiais como SINAPI ou SICRO.
                "
              />

              <div
                className="
                  rounded-[28px]
                  border
                  border-white/10
                  bg-white/[0.03]
                  p-6
                "
              >
                <h3 className="font-semibold mb-6">Fluxo do orçamento</h3>

                <div className="space-y-5">
                  <StepItem active number="1" title="Dados iniciais" />

                  <StepItem active number="2" title="Origem dos serviços" />

                  <StepItem active number="3" title="Selecionar serviços" />
                </div>
              </div>

              <div
                className="
                  rounded-[28px]
                  border
                  border-emerald-500/20
                  bg-emerald-500/10
                  p-6
                "
              >
                <p className="text-sm text-emerald-300 mb-2">
                  Origem selecionada
                </p>

                <h3 className="text-2xl font-bold text-emerald-400 uppercase">
                  {form.tabela || "-"}
                </h3>
              </div>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-8">
                {/* ========================================= */}
                {/* ETAPA 1 */}
                {/* ========================================= */}
                <div
                  className="
                    rounded-[32px]
                    border
                    border-white/10
                    bg-white/[0.03]
                    p-8
                  "
                >
                  <div className="flex items-center gap-4 mb-10">
                    <div
                      className="
                        w-14
                        h-14
                        rounded-2xl
                        bg-emerald-500/15
                        border
                        border-emerald-500/20
                        flex
                        items-center
                        justify-center
                      "
                    >
                      <FolderKanban size={24} className="text-emerald-400" />
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold">
                        Etapa 1 · Dados iniciais
                      </h2>

                      <p className="text-sm text-zinc-400">
                        Informações básicas do orçamento
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    <Input
                      label="Número do orçamento *"
                      value={form.numero}
                      onChange={(v: string) => updateField("numero", v)}
                      placeholder="Ex: ORC-2026-0001"
                    />

                    <ProjectAutocomplete
                      label="Obra *"
                      value={projectSearch}
                      selectedProject={selectedProject}
                      options={filteredProjects}
                      open={projectOpen}
                      loading={loadingProjects}
                      onFocus={() => setProjectOpen(true)}
                      onBlur={() =>
                        window.setTimeout(() => setProjectOpen(false), 150)
                      }
                      onSearchChange={(value: string) => {
                        setProjectSearch(value);
                        setProjectOpen(true);
                        setForm((prev) => ({ ...prev, obra: "" }));
                      }}
                      onSelect={(project) => {
                        setForm((prev) => ({
                          ...prev,
                          obra: project.id,
                        }));
                        setProjectSearch(project.nome);
                        setProjectOpen(false);
                      }}
                    />

                    <Select
                      label="Tipo de orçamento *"
                      value={form.tipo}
                      onChange={(e: any) => updateField("tipo", e.target.value)}
                      options={[
                        {
                          label: "Orçamento executivo",
                          value: "executivo",
                        },
                        {
                          label: "Orçamento preliminar",
                          value: "preliminar",
                        },
                        {
                          label: "Levantamento quantitativo",
                          value: "quantitativo",
                        },
                        {
                          label: "Reforma",
                          value: "reforma",
                        },
                      ]}
                    />

                    <Input
                      label="Nome do orçamento"
                      value={form.nome}
                      onChange={(v: string) => updateField("nome", v)}
                      placeholder="Ex: Estrutura Bloco A"
                    />

                    <div>
                      <label
                        className="
                          block
                          text-sm
                          text-zinc-400
                          mb-2
                        "
                      >
                        Status
                      </label>

                      <div
                        className="
                          h-14
                          rounded-2xl
                          border
                          border-emerald-500/20
                          bg-emerald-500/10
                          text-emerald-400
                          px-4
                          flex
                          items-center
                          font-medium
                        "
                      >
                        Em edição
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <label
                      className="
                        block
                        text-sm
                        text-zinc-400
                        mb-2
                      "
                    >
                      Observações
                    </label>

                    <textarea
                      rows={5}
                      value={form.observacoes}
                      onChange={(e) =>
                        updateField("observacoes", e.target.value)
                      }
                      placeholder="Digite observações..."
                      className="
                        w-full
                        rounded-2xl
                        border
                        border-white/10
                        bg-black/40
                        px-4
                        py-4
                        outline-none
                        resize-none
                        focus:border-emerald-500/40
                      "
                    />
                  </div>

                  <div
                    className="
                      flex
                      justify-end
                      mt-10
                    "
                  >
                    <button
                      onClick={() => {
                        scrollToSection("step-2");
                      }}
                      className="
                        h-14
                        px-7
                        rounded-2xl
                        bg-emerald-500
                        text-black
                        font-semibold
                        flex
                        items-center
                        gap-3
                        hover:bg-emerald-400
                        transition-all
                      "
                    >
                      Ir para etapa 2
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                {/* ========================================= */}
                {/* ETAPA 2 */}
                {/* ========================================= */}
                <div
                  id="step-2"
                  className="
                    rounded-[32px]
                    border
                    border-white/10
                    bg-white/[0.03]
                    overflow-hidden
                  "
                >
                  <div
                    className="
                      px-8
                      py-6
                      border-b
                      border-white/10
                    "
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="
                          w-14
                          h-14
                          rounded-2xl
                          bg-blue-500/10
                          border
                          border-blue-500/20
                          flex
                          items-center
                          justify-center
                        "
                      >
                        <Database size={24} className="text-blue-400" />
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold">
                          Etapa 2 · Origem dos serviços
                        </h2>

                        <p className="text-sm text-zinc-400">
                          Escolha a base utilizada no orçamento
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      {tabelas.map((item) => {
                        const active = form.tabela === item.id;

                        return (
                          <button
                            key={item.id}
                            onClick={() => updateField("tabela", item.id)}
                            className={`
    relative
    text-left
    rounded-[24px]
    border
    p-4
    transition-all
    min-h-[210px]
    ${
      active
        ? `
          border-emerald-500/40
          bg-emerald-500/10
        `
        : `
          border-white/10
          bg-black/20
          hover:border-white/20
        `
    }
  `}
                          >
                            {active && (
                              <div
                                className="
        absolute
        top-4
        right-4
        w-7
        h-7
        rounded-lg
        bg-emerald-500
        flex
        items-center
        justify-center
      "
                              >
                                <Check size={14} className="text-black" />
                              </div>
                            )}

                            <div
                              className="
      w-12
      h-12
      rounded-xl
      border
      border-white/10
      bg-white/[0.03]
      flex
      items-center
      justify-center
      mb-4
    "
                            >
                              {item.id === "inteligente" ? (
                                <Sparkles
                                  size={20}
                                  className="text-purple-400"
                                />
                              ) : (
                                <Layers3 size={20} className="text-zinc-300" />
                              )}
                            </div>

                            <h3 className="text-base font-bold mb-2">
                              {item.nome}
                            </h3>

                            <p className="text-xs text-zinc-400 leading-relaxed">
                              {item.descricao}
                            </p>

                            {item.badge && (
                              <div
                                className="
        mt-4
        inline-flex
        items-center
        gap-2
        px-2.5
        py-1.5
        rounded-full
        bg-emerald-500/10
        border
        border-emerald-500/20
        text-emerald-400
        text-[11px]
        font-medium
      "
                              >
                                <ShieldCheck size={12} />

                                {item.badge}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* BOTÃO ETAPA 3 */}
                    <div
                      className="
                        flex
                        justify-end
                        mt-10
                      "
                    >
                      <button
                        onClick={() => scrollToSection("step-3")}
                        className="
                        h-14
                        px-7
                        rounded-2xl
                        bg-emerald-500
                        text-black
                        font-semibold
                        flex
                        items-center
                        gap-3
                        hover:bg-emerald-400
                        transition-all
                        "
                      >
                        Ir para etapa 3
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ========================================= */}
                {/* ETAPA 3 */}
                {/* ========================================= */}

                {form.tabela ? (
                  <div
                    id="step-3"
                    className="
      rounded-[32px]
      border
      border-white/10
      bg-white/[0.03]
      overflow-hidden
    "
                  >
                    <div
                      className="
        px-8
        py-6
        border-b
        border-white/10
      "
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="
            w-14
            h-14
            rounded-2xl
            bg-purple-500/10
            border
            border-purple-500/20
            flex
            items-center
            justify-center
          "
                        >
                          <Calculator size={24} className="text-purple-400" />
                        </div>

                        <div>
                          <h2 className="text-2xl font-bold">
                            Etapa 3 · Biblioteca de serviços
                          </h2>

                          <p className="text-sm text-zinc-400">
                            Serviços carregados da base selecionada
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px]">
                      {/* LEFT */}
                      <div className="p-8">
                        {/* ALERTA */}
                        <div
                          className="
            mb-6
            rounded-[24px]
            border
            border-emerald-500/20
            bg-emerald-500/10
            p-5
          "
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className="
                w-12
                h-12
                rounded-2xl
                bg-emerald-500/15
                border
                border-emerald-500/20
                flex
                items-center
                justify-center
                shrink-0
              "
                            >
                              <Database
                                size={20}
                                className="text-emerald-400"
                              />
                            </div>

                            <div>
                              <p className="font-semibold mb-1">
                                Base selecionada:{" "}
                                <span className="uppercase text-emerald-400">
                                  {form.tabela}
                                </span>
                              </p>

                              <p className="text-sm text-zinc-400 leading-relaxed">
                                Os serviços exibidos abaixo pertencem à tabela
                                selecionada na etapa anterior. Você pode adicionar,
                                remover e ajustar os serviços conforme necessário.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* BUSCA */}
                        <div
                          className="
            h-16
            rounded-2xl
            border
            border-white/10
            bg-black/40
            px-5
            flex
            items-center
            gap-4
            mb-6
          "
                        >
                          <Search size={18} className="text-zinc-500" />

                          <input
                            value={serviceSearch}
                            onChange={(e) => setServiceSearch(e.target.value)}
                            placeholder="
              Buscar serviço, código ou categoria...
            "
                            className="
              flex-1
              bg-transparent
              outline-none
              text-white
            "
                          />
                        </div>

                        {/* CATEGORIAS */}
                        <div className="flex flex-wrap gap-3 mb-8">
                          {categories.map((item) => (
                            <button
                              key={item}
                              onClick={() => setSelectedCategory(item)}
                              className={`
                h-11
                px-5
                rounded-2xl
                border
                text-sm
                transition-all
                ${
                  selectedCategory === item
                    ? `
                      border-emerald-500/30
                      bg-emerald-500/10
                      text-emerald-300
                    `
                    : `
                      border-white/10
                      bg-white/[0.03]
                      text-zinc-400
                      hover:border-emerald-500/20
                      hover:text-white
                    `
                }
              `}
                            >
                              {item}
                            </button>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mb-8">
                          <button
                            onClick={selectAllVisibleServices}
                            className="
                              h-11
                              px-5
                              rounded-2xl
                              bg-emerald-500
                              text-black
                              text-sm
                              font-semibold
                              hover:bg-emerald-400
                              transition-all
                            "
                          >
                            Selecionar todos
                          </button>

                          <button
                            onClick={clearSelection}
                            className="
                              h-11
                              px-5
                              rounded-2xl
                              border
                              border-white/10
                              bg-white/[0.03]
                              text-sm
                              text-zinc-300
                              hover:border-white/20
                              transition-all
                            "
                          >
                            Limpar seleção
                          </button>

                          <span className="text-sm text-zinc-400">
                            {selectedCount} selecionado(s)
                          </span>
                        </div>

                        {/* SERVICES */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {loadingServices ? (
                            <div className="text-zinc-400">
                              Carregando serviços...
                            </div>
                          ) : filteredServices.length === 0 ? (
                            <div className="text-zinc-500">
                              {services.length === 0
                                ? "Nenhum serviço encontrado"
                                : "Nenhum serviço encontrado para os filtros selecionados"}
                            </div>
                          ) : (
                            filteredServices.map((item) => (
                              <ServiceCard
                                key={item.id}
                                item={{
                                  id: item.id,
                                  nome: item.description,
                                  codigo: item.code,
                                  unidade: item.unit,
                                  valorBase: item.total_cost,
                                }}
                                selected={Boolean(selectedServices[item.id])}
                                quantity={selectedServices[item.id]?.quantity ?? 1}
                                editedBaseValue={
                                  selectedServices[item.id]?.baseValue ??
                                  item.total_cost
                                }
                                bdiPercentage={
                                  selectedServices[item.id]?.bdiPercentage ?? 25
                                }
                                onToggle={() => toggleService(item)}
                                onChangeQuantity={(value: number) =>
                                  updateServiceQuantity(item, value)
                                }
                                onChangeBaseValue={(value: number) =>
                                  updateServiceBaseValue(item, value)
                                }
                                onChangeBdiPercentage={(value: number) =>
                                  updateServiceBdiPercentage(item, value)
                                }
                              />
                            ))
                          )}
                        </div>
                      </div>

                      {/* RIGHT */}
                      <div
                        className="
          border-l
          border-white/10
          bg-black/20
          p-6
        "
                      >
                        <div className="sticky top-24">
                          <div className="mb-8">
                            <h3 className="text-xl font-bold mb-2">
                              Resumo do orçamento
                            </h3>

                            <p className="text-sm text-zinc-400">
                              Serviços adicionados
                            </p>
                          </div>

                          <div
                            className="
              rounded-[28px]
              border
              border-emerald-500/20
              bg-emerald-500/10
              p-6
              mb-6
            "
                          >
                            <p className="text-sm text-emerald-300 mb-2">
                              Custo total
                            </p>

                            <h2 className="text-4xl font-bold text-emerald-400">
                              {`R$ ${selectedTotal.toFixed(2)}`}
                            </h2>
                          </div>

                          <div
                            className="
              rounded-[28px]
              border
              border-blue-500/20
              bg-blue-500/10
              p-6
              mb-6
            "
                          >
                            <p className="text-sm text-blue-300 mb-2">
                              Total com BDI
                            </p>

                            <h2 className="text-3xl font-bold text-blue-300">
                              {`R$ ${selectedSaleTotal.toFixed(2)}`}
                            </h2>
                          </div>

                          <div
                            className="
              rounded-[28px]
              border
              border-white/10
              bg-white/[0.03]
              p-8
              text-center
            "
                          >
                            <div
                              className="
                w-16
                h-16
                rounded-3xl
                bg-white/[0.03]
                border
                border-white/10
                flex
                items-center
                justify-center
                mx-auto
                mb-5
              "
                            >
                              <FileText size={28} className="text-zinc-500" />
                            </div>

                            <h4 className="font-semibold mb-2">
                              {selectedCount === 0
                                ? "Nenhum serviço selecionado"
                                : `${selectedCount} serviço(s) selecionado(s)`}
                            </h4>

                            <p className="text-sm text-zinc-500 leading-relaxed">
                              {selectedCount === 0
                                ? "Os itens adicionados aparecerão aqui para composição financeira."
                                : "Você pode ajustar quantidade, valor base e BDI direto nos cards."}
                            </p>
                          </div>

                          <button
                            onClick={handleUpdateBudget}
                            disabled={savingBudget}
                            className="
                              mt-6
                              w-full
                              h-14
                              rounded-2xl
                              bg-emerald-500
                              text-black
                              font-semibold
                              flex
                              items-center
                              justify-center
                              gap-3
                              hover:bg-emerald-400
                              disabled:opacity-60
                              disabled:cursor-not-allowed
                              transition-all
                            "
                          >
                            <Save size={18} />
                            {savingBudget ? "Atualizando..." : "Atualizar orçamento"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    id="step-3"
                    className="
      rounded-[32px]
      border
      border-dashed
      border-white/10
      bg-white/[0.02]
      p-16
      text-center
    "
                  >
                    <div
                      className="
        w-20
        h-20
        rounded-[28px]
        bg-white/[0.03]
        border
                        border-white/10
        flex
        items-center
        justify-center
        mx-auto
        mb-8
      "
                    >
                      <Database size={38} className="text-zinc-600" />
                    </div>

                    <h3 className="text-2xl font-bold mb-3">
                      Selecione uma origem de serviços
                    </h3>

                    <p
                      className="
        text-zinc-500
        max-w-2xl
        mx-auto
        leading-relaxed
      "
                    >
                      Escolha uma tabela de composição na etapa 2 para carregar
                      os serviços disponíveis da base selecionada.
                    </p>
                  </div>
                )}
              </div>
            </div>
              </>
            )}

            {/* ABA CRONOGRAMA */}
            {activeTab === "cronograma" && (
              <ScheduleView
                selectedServices={selectedServicesList}
                scheduleTasks={scheduleTasks}
                onUpdateSchedule={(taskId, config) => {
                  setScheduleTasks((prev) => ({
                    ...prev,
                    [taskId]: config,
                  }));
                }}
              />
            )}

            {/* ABAS NAO IMPLEMENTADAS */}
            {activeTab !== "dados" && activeTab !== "cronograma" && (
              <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-16 text-center">
                <div className="w-20 h-20 rounded-[28px] bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto mb-8">
                  <FileText size={38} className="text-zinc-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Seção em desenvolvimento</h3>
                <p className="text-zinc-500 max-w-2xl mx-auto leading-relaxed">
                  A aba "{activeTab}" ainda não foi implementada. Estamos trabalhando para disponibilizá-la em breve.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Input({ label, placeholder, value, onChange }: any) {
  return (
    <div>
      <label
        className="
          block
          text-sm
          text-zinc-400
          mb-2
        "
      >
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full
          h-14
          rounded-2xl
          border
          border-white/10
          bg-black/40
          px-4
          outline-none
          focus:border-emerald-500/40
        "
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: any) {
  return (
    <div>
      <label
        className="
          block
          text-sm
          text-zinc-400
          mb-2
        "
      >
        {label}
      </label>

      <select
        value={value}
        onChange={onChange}
        className="
          w-full
          h-14
          px-4
          rounded-2xl
          border
          border-white/10
          bg-black/40
          outline-none
          text-white
          appearance-none
          focus:border-emerald-500/40
        "
      >
        <option value="">Selecione</option>

        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function StepItem({ number, title, active }: any) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={`
          w-10
          h-10
          rounded-2xl
          flex
          items-center
          justify-center
          text-sm
          font-bold
          border
          ${
            active
              ? `
                bg-emerald-500
                border-emerald-500
                text-black
              `
              : `
                bg-white/[0.03]
                border-white/10
                text-zinc-400
              `
          }
        `}
      >
        {number}
      </div>

      <p className={active ? "font-semibold" : "text-zinc-400"}>{title}</p>
    </div>
  );
}

function InfoCard({ icon, title, description }: any) {
  return (
    <div
      className="
        rounded-[28px]
        border
        border-white/10
        bg-white/[0.03]
        p-6
      "
    >
      <div
        className="
          w-14
          h-14
          rounded-2xl
          bg-white/[0.03]
          border
          border-white/10
          flex
          items-center
          justify-center
          mb-5
        "
      >
        {icon}
      </div>

      <h3 className="text-xl font-bold mb-2">{title}</h3>

      <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}

function ServiceCard({
  item,
  selected,
  quantity,
  editedBaseValue,
  bdiPercentage,
  onToggle,
  onChangeQuantity,
  onChangeBaseValue,
  onChangeBdiPercentage,
}: any) {
  return (
    <div
      className={`
        group
        rounded-[28px]
        border
        ${selected ? "border-emerald-500/30" : "border-white/10"}
        bg-white/[0.03]
        p-6
        hover:border-emerald-500/20
        transition-all
      `}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3
            className="
              text-lg
              font-semibold
              mb-2
            "
          >
            {item.nome}
          </h3>

          <p className="text-sm text-zinc-500">{item.codigo}</p>
        </div>

        <button
          onClick={onToggle}
          className="
            w-11
            h-11
            rounded-2xl
            bg-white/[0.03]
            border
            border-white/10
            flex
            items-center
            justify-center
            group-hover:border-emerald-500
            transition-all
          "
        >
          {selected ? (
            <Check size={18} className="text-emerald-400" />
          ) : (
            <Plus size={18} className="text-zinc-500" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div>
          <p className="text-xs text-zinc-500 mb-1">Quantidade</p>

          <input
            type="number"
            min={1}
            step="0.01"
            value={quantity}
            onChange={(e) => onChangeQuantity(Number(e.target.value))}
            className="
              w-full
              h-11
              rounded-xl
              border
              border-white/10
              bg-black/30
              px-3
              outline-none
              focus:border-emerald-500/40
            "
          />
        </div>

        <div>
          <p className="text-xs text-zinc-500 mb-1">Valor base</p>

          <input
            type="text"
            inputMode="decimal"
            value={formatCurrencyBRL(editedBaseValue)}
            onChange={(e) => onChangeBaseValue(parseCurrencyInput(e.target.value))}
            className="
              w-full
              h-11
              rounded-xl
              border
              border-white/10
              bg-black/30
              px-3
              outline-none
              focus:border-emerald-500/40
            "
          />
        </div>

        <div>
          <p className="text-xs text-zinc-500 mb-1">BDI (%)</p>

          <input
            type="number"
            min={0}
            step="0.01"
            value={bdiPercentage}
            onChange={(e) => onChangeBdiPercentage(Number(e.target.value))}
            className="
              w-full
              h-11
              rounded-xl
              border
              border-white/10
              bg-black/30
              px-3
              outline-none
              focus:border-emerald-500/40
            "
          />
        </div>
      </div>

      <div className="flex items-center gap-6 flex-wrap">
        <div>
          <p className="text-xs text-zinc-500 mb-1">Unidade</p>

          <p className="font-medium">{item.unidade}</p>
        </div>

        <div>
          <p className="text-xs text-zinc-500 mb-1">Subtotal</p>

          <p className="font-medium text-emerald-400">
            {formatCurrencyBRL(quantity * editedBaseValue)}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500 mb-1">Subtotal com BDI</p>

          <p className="font-medium text-blue-300">
            {formatCurrencyBRL(
              quantity * editedBaseValue * (1 + bdiPercentage / 100)
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

type ScheduleGroupedServices = {
  category: string;
  items: Array<{
    service: ServiceItem;
    config: SelectedServiceConfig;
  }>;
};

function buildCategoryHierarchy(
  selectedServicesList: Array<{
    service: ServiceItem;
    config: SelectedServiceConfig;
  }>
): ScheduleGroupedServices[] {
  const grouped = new Map<string, typeof selectedServicesList>();

  selectedServicesList.forEach((item) => {
    const category = item.service.category;
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(item);
  });

  return Array.from(grouped.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}

function getDateRange(scheduleTasks: Record<string, ScheduleTaskConfig>) {
  const dates = Object.values(scheduleTasks)
    .filter((task) => task.startDate)
    .map((task) => ({
      start: new Date(task.startDate),
      end: new Date(new Date(task.startDate).getTime() + task.duration * 24 * 60 * 60 * 1000),
    }));

  if (dates.length === 0) {
    const today = new Date();
    return {
      min: today,
      max: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  const min = new Date(Math.min(...dates.map((d) => d.start.getTime())));
  const max = new Date(Math.max(...dates.map((d) => d.end.getTime())));

  return { min, max };
}

function ScheduleView({
  selectedServices,
  scheduleTasks,
  onUpdateSchedule,
}: {
  selectedServices: Array<{ service: ServiceItem; config: SelectedServiceConfig }>;
  scheduleTasks: Record<string, ScheduleTaskConfig>;
  onUpdateSchedule: (taskId: string, config: ScheduleTaskConfig) => void;
}) {
  const grouped = useMemo(() => buildCategoryHierarchy(selectedServices), [selectedServices]);
  const dateRange = useMemo(() => getDateRange(scheduleTasks), [scheduleTasks]);

  const daysDiff = Math.ceil(
    (dateRange.max.getTime() - dateRange.min.getTime()) / (1000 * 60 * 60 * 24)
  );

  const getTaskDates = (taskId: string) => {
    const config = scheduleTasks[taskId];
    if (!config) {
      return null;
    }
    const startDate = new Date(config.startDate);
    const endDate = new Date(startDate.getTime() + config.duration * 24 * 60 * 60 * 1000);
    return { startDate, endDate };
  };

  const getCategoryDates = (category: string) => {
    const categoryTasks = grouped
      .find((g) => g.category === category)
      ?.items.map((item) => getTaskDates(item.service.id))
      .filter(Boolean) as Array<{ startDate: Date; endDate: Date }>;

    if (categoryTasks.length === 0) return null;

    const starts = categoryTasks.map((t) => t.startDate.getTime());
    const ends = categoryTasks.map((t) => t.endDate.getTime());

    return {
      startDate: new Date(Math.min(...starts)),
      endDate: new Date(Math.max(...ends)),
    };
  };

  const getBarPosition = (startDate: Date, endDate: Date) => {
    const taskStart = startDate.getTime() - dateRange.min.getTime();
    const taskDuration = endDate.getTime() - startDate.getTime();
    const totalDuration = dateRange.max.getTime() - dateRange.min.getTime();

    const left = (taskStart / totalDuration) * 100;
    const width = (taskDuration / totalDuration) * 100;

    return { left, width };
  };

  return (
    <div className="space-y-8">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-blue-500/10 via-white/[0.03] to-white/[0.02] p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-3xl rounded-full" />
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center mb-6">
            <Calculator size={30} className="text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Cronograma do projeto</h2>
          <p className="text-zinc-400 max-w-3xl leading-relaxed">
            Defina as datas de início e duração para cada serviço. Os itens pais abrangem o período de suas atividades filhas.
          </p>
        </div>
      </div>

      {/* CRONOGRAMA */}
      <div className="rounded-[32px] border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="px-8 py-6 border-b border-white/10">
          <h3 className="text-2xl font-bold">Planejamento temporal</h3>
          <p className="text-sm text-zinc-400 mt-2">Período: {Math.ceil(daysDiff)} dias</p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-max p-8">
            {/* HEADER COM MESES/SEMANAS */}
            <div className="mb-8">
              <div className="flex gap-2 mb-2">
                <div className="w-80 flex-shrink-0"></div>
                <div className="flex-1 flex gap-2">
                  {Array.from({ length: Math.ceil(daysDiff / 7) }).map((_, weekIdx) => {
                    const weekStart = new Date(dateRange.min.getTime() + weekIdx * 7 * 24 * 60 * 60 * 1000);
                    return (
                      <div
                        key={weekIdx}
                        className="text-xs text-zinc-400 text-center"
                        style={{ width: `${(7 / daysDiff) * 100}%` }}
                      >
                        {weekStart.toLocaleDateString("pt-BR", { month: "short", day: "numeric" })}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TIMELINE */}
              <div className="flex gap-2">
                <div className="w-80 flex-shrink-0"></div>
                <div className="flex-1 relative h-6 bg-white/[0.03] rounded-xl overflow-hidden border border-white/10">
                  <div className="absolute inset-0 flex">
                    {Array.from({ length: daysDiff }).map((_, dayIdx) => (
                      <div
                        key={dayIdx}
                        className="flex-1 border-r border-white/5 text-[8px] text-zinc-600 flex items-center justify-center"
                      >
                        {dayIdx % 7 === 0 ? dayIdx : ""}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* TASKS */}
            <div className="space-y-6">
              {grouped.map((group) => {
                const categoryDates = getCategoryDates(group.category);

                return (
                  <div key={group.category} className="space-y-3">
                    {/* CATEGORIA (PAI) */}
                    {categoryDates && (
                      <div className="flex gap-2 items-center">
                        <div className="w-80 flex-shrink-0">
                          <p className="font-bold text-zinc-200">{group.category}</p>
                        </div>
                        <div className="flex-1 relative h-10 bg-white/[0.03] rounded-xl border border-blue-500/30 overflow-hidden">
                          <div
                            className="absolute top-0 bottom-0 bg-gradient-to-r from-blue-500/40 to-blue-500/20 rounded-lg border border-blue-400/50 flex items-center justify-center text-xs font-medium text-blue-200"
                            style={{
                              left: `${getBarPosition(categoryDates.startDate, categoryDates.endDate).left}%`,
                              width: `${getBarPosition(categoryDates.startDate, categoryDates.endDate).width}%`,
                            }}
                          >
                            {Math.ceil(
                              (categoryDates.endDate.getTime() - categoryDates.startDate.getTime()) /
                                (1000 * 60 * 60 * 24)
                            )}{" "}
                            dias
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SERVIÇOS (FILHOS) */}
                    {group.items.map(({ service }) => {
                      const dates = getTaskDates(service.id);
                      const config = scheduleTasks[service.id];

                      return (
                        <div key={service.id} className="flex gap-2 items-start">
                          <div className="w-80 flex-shrink-0 space-y-2">
                            <p className="text-sm text-zinc-300">{service.description}</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-zinc-500 block mb-1">Início</label>
                                <input
                                  type="date"
                                  value={config?.startDate || ""}
                                  onChange={(e) => {
                                    onUpdateSchedule(service.id, {
                                      startDate: e.target.value,
                                      duration: config?.duration || 1,
                                    });
                                  }}
                                  className="w-full h-9 rounded-lg border border-white/10 bg-black/40 px-2 text-sm outline-none focus:border-blue-500/40 text-white"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-zinc-500 block mb-1">Dias</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={config?.duration || 1}
                                  onChange={(e) => {
                                    onUpdateSchedule(service.id, {
                                      startDate: config?.startDate || new Date().toISOString().split("T")[0],
                                      duration: Number(e.target.value),
                                    });
                                  }}
                                  className="w-full h-9 rounded-lg border border-white/10 bg-black/40 px-2 text-sm outline-none focus:border-blue-500/40 text-white"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 relative h-10 bg-white/[0.03] rounded-xl border border-white/10 overflow-hidden">
                            {dates && (
                              <div
                                className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-500/40 to-emerald-500/20 rounded-lg border border-emerald-400/50 flex items-center justify-center text-xs font-medium text-emerald-200"
                                style={{
                                  left: `${getBarPosition(dates.startDate, dates.endDate).left}%`,
                                  width: `${getBarPosition(dates.startDate, dates.endDate).width}%`,
                                }}
                              >
                                {config?.duration || 0}d
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* VAZIO */}
            {grouped.length === 0 && (
              <div className="text-center py-12">
                <Database size={38} className="text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400">Adicione serviços na aba anterior para montar o cronograma</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
