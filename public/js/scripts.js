$(document).ready(function () {
  $(".dropdown-link").on("click", function (e) {
    var $submenu = $(this).next(".dropdown-menu-subitem");

    // Fecha outros submenus abertos no mesmo nível
    $(this).closest('.dropdown-menu').find('.dropdown-menu-subitem').not($submenu).hide();

    $submenu.toggle(); // Alterna a visibilidade do submenu clicado
    e.stopPropagation();
    e.preventDefault();
  });

  // Fecha os submenus ao clicar fora
  $(document).on("click", function (e) {
    if (!$(e.target).closest('.dropdown-submenu').length) {
      $(".dropdown-menu-subitem").hide();
    }
  });

  // Fecha os submenus ao clicar em qualquer link que não seja um dropdown-link
  $(document).on("click", ".dropdown-item:not(.dropdown-link)", function () {
    $(".dropdown-menu-subitem").hide();
  });
});



$(document).ready(function () {
  $("#tabela-default").DataTable({
    lengthMenu: [
      [8, 25, 50, -1],
      [8, 25, 50, "Todos"],
    ],

    colReorder: true,

    dom: "Brft<'row'<'col-md-4'l><'col-md-8'p>>",

    columnDefs: [
      {
        targets: 2,
        render: function (data, type, row, meta) {
          return data.length > 20 ? data.substr(0, 30) + "..." : data;
        },
      },
    ],

    buttons: [
      {
        extend: "pdfHtml5",
        text: "Salvar em PDF",
      },
      {
        extend: "excelHtml5",
        text: "Salvar em Excel",
      },
    ],

    language: {
      lengthMenu: "_MENU_ resultados por página",
      zeroRecords: "Nada encontrado - desculpe",
      info: "Mostrando página _PAGE_ de _PAGES_",
      infoEmpty: "Sem resultados avaliados",
      infoFiltered: "(filtrado de _MAX_ total registros)",
      paginate: {
        first: "Primeiro",
        last: "Anterior",
        next: "Próximo",
        previous: "Anterior",
      },
      search: "Buscar:",
    },
  });
});


$(document).ready(function () {
  $("#tabela-list_despesas").DataTable({
    lengthMenu: [
      [8, 25, 50, -1],
      [8, 25, 50, "Todos"],
    ],

    colReorder: true,

    dom: "Brft<'row'<'col-md-4'l><'col-md-8'p>>",

    columnDefs: [
      {
        targets: 1,
        render: function (data, type, row, meta) {
          return data.length > 20 ? data.substr(0, 15) + "..." : data;
        },
      },
    ],

    buttons: [
      {
        extend: "pdfHtml5",
        text: "Salvar em PDF",
      },
      {
        extend: "excelHtml5",
        text: "Salvar em Excel",
      },
    ],

    language: {
      lengthMenu: "_MENU_ resultados por página",
      zeroRecords: "Nada encontrado - desculpe",
      info: "Mostrando página _PAGE_ de _PAGES_",
      infoEmpty: "Sem resultados avaliados",
      infoFiltered: "(filtrado de _MAX_ total registros)",
      paginate: {
        first: "Primeiro",
        last: "Anterior",
        next: "Próximo",
        previous: "Anterior",
      },
      search: "Buscar:",
    },
  });
});


$(document).ready(function () {
  $("#tabela-despesas-gerais").DataTable({
    lengthMenu: [
      [8, 25, 50, -1],
      [8, 25, 50, "Todos"],
    ],

    colReorder: true,

    dom: "Brft<'row'<'col-md-4'l><'col-md-8'p>>",

    columnDefs: [
      {
        targets: 0,
        render: function (data) {
          return data.length > 30 ? data.substr(0, 30) + "..." : data;
        },
      },
    ],

    buttons: [
      {
        extend: "pdfHtml5",
        text: "Salvar em PDF",
      },
      {
        extend: "excelHtml5",
        text: "Salvar em Excel",
      },
    ],

    language: {
      lengthMenu: "_MENU_ resultados por página",
      zeroRecords: "Nada encontrado - desculpe",
      info: "Mostrando página _PAGE_ de _PAGES_",
      infoEmpty: "Sem resultados avaliados",
      infoFiltered: "(filtrado de _MAX_ total registros)",
      paginate: {
        first: "Primeiro",
        last: "Anterior",
        next: "Próximo",
        previous: "Anterior",
      },
      search: "Buscar:",
    },
  });
});


$(document).ready(function () {
  $("#tabela-moradores").DataTable({
    lengthMenu: [
      [8, 25, 50, -1],
      [8, 25, 50, "Todos"],
    ],

    colReorder: true,

    dom: "Brft<'row'<'col-md-4'l><'col-md-8'p>>",

    // Configurações para diferentes tamanhos de data.substr()
    columnDefs: [
      {
        targets: [0], // Aplica à coluna 0
        render: function (data) {
          return data.length > 25 ? data.substr(0, 25) + "..." : data; // Trunca para 20 caracteres
        },
      },
      {
        targets: [4], // Aplica à coluna 2
        render: function (data) {
          return data.length > 15 ? data.substr(0, 15) + "..." : data; // Trunca para 40 caracteres
        },
      },
    ],

    buttons: [
      {
        extend: "pdfHtml5",
        text: "Salvar em PDF",
      },
      {
        extend: "excelHtml5",
        text: "Salvar em Excel",
      },
    ],

    language: {
      lengthMenu: "_MENU_ resultados por página",
      zeroRecords: "Nada encontrado - desculpe",
      info: "Mostrando página _PAGE_ de _PAGES_",
      infoEmpty: "Sem resultados avaliados",
      infoFiltered: "(filtrado de _MAX_ total registros)",
      paginate: {
        first: "Primeiro",
        last: "Anterior",
        next: "Próximo",
        previous: "Anterior",
      },
      search: "Buscar:",
    },
  });
});

$(document).ready(function () {
  $("#tabela-faturamento").DataTable({
    lengthMenu: [
      [8, 25, 50, -1],
      [8, 25, 50, "Todos"],
    ],
    colReorder: true,
    dom: "<'row'<'col-sm-12 col-md-5'f>>" + "<'row'<'col-sm-12'tr>>" + "<'row'<'col-sm-12 col-md-5'l><'col-sm-12 col-md-7'p>>",
    columnDefs: [
      {
        targets: 2,
        render: function (data, type, row, meta) {
          return data.length > 20 ? data.substr(0, 30) + "..." : data;
        },
      },
    ],
    buttons: [
      {
        extend: "pdfHtml5",
        text: "Salvar em PDF",
      },
      {
        extend: "excelHtml5",
        text: "Salvar em Excel",
      },
    ],
    language: {
      lengthMenu: " _MENU_ resultados por pág",
      zeroRecords: "Nada encontrado - desculpe",
      info: "Mostrando página _PAGE_ de _PAGES_",
      infoEmpty: "Sem resultados avaliados",
      infoFiltered: "(filtrado de _MAX_ total registros)",
      paginate: {
        first: "Primeiro",
        last: "Último",
        next: "Próximo",
        previous: "Anterior",
      },
      search: "Buscar:",
    },
    initComplete: function (settings, json) {
      $('.dataTables_filter').css({
        'text-align': 'left',
        'padding-left': '0'
      });
    }
  });
});


$(document).ready(function () {
  $("#table_movimentos").DataTable({
    lengthMenu: [
      [8, 25, 50, -1],
      [8, 25, 50, "Todos"],
    ],
    colReorder: true,
    dom: "Brft<'row'<'col-md-4'l><'col-md-8'p>>",
    columnDefs: [
      {
        targets: 2,
        render: function (data, type, row, meta) {
          return data.length > 20 ? data.substr(0, 30) + "..." : data;
        },
      },
    ],
    buttons: [
      {
        extend: "pdfHtml5",
        text: "Salvar em PDF",
      },
      {
        extend: "excelHtml5",
        text: "Salvar em Excel",
      },
    ],
    language: {
      lengthMenu: " _MENU_ resultados por pág",
      zeroRecords: "Nada encontrado - desculpe",
      info: "Mostrando página _PAGE_ de _PAGES_",
      infoEmpty: "Sem resultados avaliados",
      infoFiltered: "(filtrado de _MAX_ total registros)",
      paginate: {
        first: "Primeiro",
        last: "Último",
        next: "Próximo",
        previous: "Anterior",
      },
      search: "Buscar:",
    },
    initComplete: function (settings, json) {
      $('.dataTables_filter').css({
        'text-align': 'left',
        'padding-left': '0'
      });
    }
  });
});


$(document).ready(function () {
  $("#table_caixinhas").DataTable({
    lengthMenu: [
      [8, 25, 50, -1],
      [8, 25, 50, "Todos"],
    ],
    colReorder: true,
    dom: "Brft<'row'<'col-md-4'l><'col-md-8'p>>",
    columnDefs: [
      {
        targets: 2,
        render: function (data, type, row, meta) {
          return data.length > 20 ? data.substr(0, 30) + "..." : data;
        },
      },
    ],
    buttons: [
      {
        extend: "pdfHtml5",
        text: "Salvar em PDF",
      },
      {
        extend: "excelHtml5",
        text: "Salvar em Excel",
      },
    ],
    language: {
      lengthMenu: " _MENU_ resultados por pág",
      zeroRecords: "Nada encontrado - desculpe",
      info: "Mostrando página _PAGE_ de _PAGES_",
      infoEmpty: "Sem resultados avaliados",
      infoFiltered: "(filtrado de _MAX_ total registros)",
      paginate: {
        first: "Primeiro",
        last: "Último",
        next: "Próximo",
        previous: "Anterior",
      },
      search: "Buscar:",
    },
    initComplete: function (settings, json) {
      $('.dataTables_filter').css({
        'text-align': 'left',
        'padding-left': '0'
      });
    }
  });
});



$(document).ready(function () {
  $("#tabela-saldos").DataTable({
    lengthMenu: [
      [8, 25, 50, -1],
      [8, 25, 50, "Todos"],
    ],
    colReorder: true,
    dom: "Brft<'row'<'col-md-4'l><'col-md-8'p>>",
    columnDefs: [
      {
        targets: 0,
        render: function (data, type, row, meta) {
          return data.length > 20 ? data.substr(0, 30) + "..." : data;
        },
      },
    ],
    buttons: [
      {
        extend: "pdfHtml5",
        text: "Salvar em PDF",
      },
      {
        extend: "excelHtml5",
        text: "Salvar em Excel",
      },
    ],
    language: {
      lengthMenu: " _MENU_ resultados por pág",
      zeroRecords: "Nada encontrado - desculpe",
      info: "Mostrando página _PAGE_ de _PAGES_",
      infoEmpty: "Sem resultados avaliados",
      infoFiltered: "(filtrado de _MAX_ total registros)",
      paginate: {
        first: "Primeiro",
        last: "Último",
        next: "Próximo",
        previous: "Anterior",
      },
      search: "Buscar:",
    },
    initComplete: function (settings, json) {
      $('.dataTables_filter').css({
        'text-align': 'left',
        'padding-left': '0'
      });
    }
  });
});

$(document).ready(function () {
  $("#tabela-pagamentos").DataTable({
    lengthMenu: [
      [8, 25, 50, -1],
      [8, 25, 50, "Todos"],
    ],
    colReorder: true,
    dom: "Brft<'row'<'col-md-4'l><'col-md-8'p>>",
    columnDefs: [
      {
        targets: 0,
        render: function (data, type, row, meta) {
          return data.length > 20 ? data.substr(0, 30) + "..." : data;
        },
      },
    ],
    buttons: [
      {
        extend: "pdfHtml5",
        text: "Salvar em PDF",
      },
      {
        extend: "excelHtml5",
        text: "Salvar em Excel",
      },
    ],
    language: {
      lengthMenu: " _MENU_ resultados por pág",
      zeroRecords: "Nada encontrado - desculpe",
      info: "Mostrando página _PAGE_ de _PAGES_",
      infoEmpty: "Sem resultados avaliados",
      infoFiltered: "(filtrado de _MAX_ total registros)",
      paginate: {
        first: "Primeiro",
        last: "Último",
        next: "Próximo",
        previous: "Anterior",
      },
      search: "Buscar:",
    },
    initComplete: function (settings, json) {
      $('.dataTables_filter').css({
        'text-align': 'left',
        'padding-left': '0'
      });
    }
  });
});